const { createApp } = Vue;

createApp({
    data() {
        return {
            innovationName: '',
            activities: [],
            chartData: [],
            roles: {
                'BIM Regisseur': { rate: 85, count: 1 },
                'BIM Coordinatoren': { rate: 60, count: 2 },
                'Quality Engineers': { rate: 55, count: 2 },
                'BIM Modelleur - Junior': { rate: 40, count: 8 },
                'BIM Modelleur - Senior': { rate: 55, count: 8 },
                'Projectmanagers': { rate: 55, count: 2 },
                'Softwaredeveloper': { rate: 55, count: 1 }
            }
        }
    },
    methods: {
        addActivity() {
            this.activities.push({
                id: Date.now(),
                name: '',
                role: Object.keys(this.roles)[0],
                currentTime: 30,
                newTime: 15,
                frequency: 1,
                workingDaysPerMonth: 20,
                peopleCount: this.roles[Object.keys(this.roles)[0]].count
            });
            this.updateChartData();
        },
        removeActivity(index) {
            this.activities.splice(index, 1);
            this.updateChartData();
        },
        formatTime(seconds) {
            if (seconds >= 60) {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                return `${minutes}m ${remainingSeconds}s`;
            }
            return `${seconds}s`;
        },
        formatMoney(amount) {
            return Math.round(amount).toLocaleString();
        },
        getDailySaved(activity) {
            return (activity.currentTime - activity.newTime) * activity.frequency;
        },
        calculateImpact() {
            let totalYearlySavings = 0;

            this.activities.forEach(activity => {
                const savedTimePerDay = this.getDailySaved(activity);
                const workingDaysPerYear = activity.workingDaysPerMonth * 12;
                const savedHoursPerYear = (savedTimePerDay * workingDaysPerYear) / 3600;
                const savings = savedHoursPerYear * this.roles[activity.role].rate * activity.peopleCount;
                totalYearlySavings += savings;
            });

            return totalYearlySavings;
        },
        getYearlyImpact() {
            return this.calculateImpact();
        },
        getMonthlyImpact() {
            return this.calculateImpact() / 12;
        },
        getWeeklyImpact() {
            return this.getMonthlyImpact() / 4.33;
        },
        updateChartData() {
            const yearlyImpact = this.getYearlyImpact();
            const monthlyImpact = this.getMonthlyImpact();
            const weeklyImpact = this.getWeeklyImpact();

            // Update chart data with the three scenarios
            this.chartData = [
                { name: 'Week', scenarioA: weeklyImpact, scenarioB: weeklyImpact * 0.7, scenarioC: weeklyImpact * 0.5 },
                { name: 'Maand', scenarioA: monthlyImpact, scenarioB: monthlyImpact * 0.7, scenarioC: monthlyImpact * 0.5 },
                { name: 'Jaar', scenarioA: yearlyImpact, scenarioB: yearlyImpact * 0.7, scenarioC: yearlyImpact * 0.5 }
            ];

            // Create new chart instance
            const data = this.chartData;
            const margin = { top: 20, right: 20, bottom: 30, left: 60 };
            const width = 600 - margin.left - margin.right;
            const height = 400 - margin.top - margin.bottom;

            // Clear previous chart
            d3.select("#impact-chart").html("");

            const svg = d3.select("#impact-chart")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // X axis
            const x = d3.scaleBand()
                .range([0, width])
                .domain(data.map(d => d.name))
                .padding(0.2);

            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            // Y axis
            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => Math.max(d.scenarioA, d.scenarioB, d.scenarioC))])
                .range([height, 0]);

            svg.append("g")
                .call(d3.axisLeft(y));

            // Add bars for each scenario
            const barWidth = x.bandwidth() / 3;

            // Scenario A bars (100%)
            svg.selectAll(".bar-a")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar-a")
                .attr("x", d => x(d.name))
                .attr("y", d => y(d.scenarioA))
                .attr("width", barWidth)
                .attr("height", d => height - y(d.scenarioA))
                .attr("fill", "#3B82F6");

            // Scenario B bars (70%)
            svg.selectAll(".bar-b")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar-b")
                .attr("x", d => x(d.name) + barWidth)
                .attr("y", d => y(d.scenarioB))
                .attr("width", barWidth)
                .attr("height", d => height - y(d.scenarioB))
                .attr("fill", "#10B981");

            // Scenario C bars (50%)
            svg.selectAll(".bar-c")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar-c")
                .attr("x", d => x(d.name) + 2 * barWidth)
                .attr("y", d => y(d.scenarioC))
                .attr("width", barWidth)
                .attr("height", d => height - y(d.scenarioC))
                .attr("fill", "#FBBF24");

            // Add legend
            const legend = svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${width - 120}, 0)`);

            const scenarios = [
                { name: "100%", color: "#3B82F6" },
                { name: "70%", color: "#10B981" },
                { name: "50%", color: "#FBBF24" }
            ];

            scenarios.forEach((scenario, i) => {
                const legendRow = legend.append("g")
                    .attr("transform", `translate(0, ${i * 20})`);

                legendRow.append("rect")
                    .attr("width", 10)
                    .attr("height", 10)
                    .attr("fill", scenario.color);

                legendRow.append("text")
                    .attr("x", 20)
                    .attr("y", 10)
                    .attr("text-anchor", "start")
                    .style("font-size", "12px")
                    .text(scenario.name);
            });
        },
        downloadPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Title
            doc.setFontSize(20);
            doc.text('B4P Innovatie Impact Calculator Rapport', 20, 20);
            
            // Innovation Name
            doc.setFontSize(16);
            doc.text(`Innovatie: ${this.innovationName || 'Naamloos'}`, 20, 35);
            
            // Date
            doc.setFontSize(12);
            doc.text(`Gegenereerd op: ${new Date().toLocaleString('nl-NL')}`, 20, 45);
            
            // Activities Table
            const tableData = this.activities.map(activity => [
                activity.name || 'Naamloze activiteit',
                activity.role,
                this.formatTime(activity.currentTime),
                this.formatTime(activity.newTime),
                activity.frequency + 'x per dag',
                activity.workingDaysPerMonth + ' dagen/maand',
                Math.round(this.getDailySaved(activity) / 60) + ' minuten/dag'
            ]);

            doc.autoTable({
                startY: 55,
                head: [['Activiteit', 'Rol', 'Huidige Tijd', 'Nieuwe Tijd', 'Frequentie', 'Werkdagen', 'Tijdsbesparing']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] }
            });

            // Financial Impact
            const impactY = doc.previousAutoTable.finalY + 20;
            doc.setFontSize(16);
            doc.text('Financiële Impact', 20, impactY);

            // Add chart image
            const chartSvg = document.querySelector('#impact-chart svg');
            if (chartSvg) {
                const svgData = new XMLSerializer().serializeToString(chartSvg);
                const canvas = document.createElement('canvas');
                canvg(canvas, svgData);
                const imgData = canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 15, impactY + 10, 180, 120);
            }

            // Scenarios text below chart
            const scenariosY = impactY + 140;
            doc.setFontSize(12);
            
            doc.text('Optimistisch Scenario (100%)', 20, scenariosY);
            doc.text(`Wekelijks: €${this.formatMoney(this.getWeeklyImpact())}`, 30, scenariosY + 7);
            doc.text(`Maandelijks: €${this.formatMoney(this.getMonthlyImpact())}`, 30, scenariosY + 14);
            doc.text(`Jaarlijks: €${this.formatMoney(this.getYearlyImpact())}`, 30, scenariosY + 21);

            doc.text('Realistisch Scenario (70%)', 20, scenariosY + 35);
            doc.text(`Wekelijks: €${this.formatMoney(this.getWeeklyImpact() * 0.7)}`, 30, scenariosY + 42);
            doc.text(`Maandelijks: €${this.formatMoney(this.getMonthlyImpact() * 0.7)}`, 30, scenariosY + 49);
            doc.text(`Jaarlijks: €${this.formatMoney(this.getYearlyImpact() * 0.7)}`, 30, scenariosY + 56);

            doc.text('Conservatief Scenario (50%)', 20, scenariosY + 70);
            doc.text(`Wekelijks: €${this.formatMoney(this.getWeeklyImpact() * 0.5)}`, 30, scenariosY + 77);
            doc.text(`Maandelijks: €${this.formatMoney(this.getMonthlyImpact() * 0.5)}`, 30, scenariosY + 84);
            doc.text(`Jaarlijks: €${this.formatMoney(this.getYearlyImpact() * 0.5)}`, 30, scenariosY + 91);
            
            // Save the PDF
            const cleanFileName = (this.innovationName || 'innovatie')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            
            doc.save(`${cleanFileName}-impact-rapport.pdf`);
        }
    },
    mounted() {
        this.addActivity();
        this.updateChartData();
    },
    watch: {
        activities: {
            deep: true,
            handler() {
                this.updateChartData();
            }
        }
    }
}).mount('#app');