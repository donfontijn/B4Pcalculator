const { createApp } = Vue;

createApp({
    data() {
        return {
            innovationName: '',
            activities: [],
            chart: null,
            updateChartTimeout: null,
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
        },
        removeActivity(index) {
            this.activities.splice(index, 1);
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
        getWeeklyImpactPerRole(role) {
            let totalImpact = 0;
            this.activities.forEach(activity => {
                if (activity.role === role) {
                    const savedTimePerDay = this.getDailySaved(activity);
                    const workingDaysPerYear = activity.workingDaysPerMonth * 12;
                    const savedHoursPerYear = (savedTimePerDay * workingDaysPerYear) / 3600;
                    const savings = (savedHoursPerYear * this.roles[role].rate) / 52; // Divide by 52 weeks
                    totalImpact += savings;
                }
            });
            return totalImpact / this.roles[role].count; // Divide by number of people in role
        },
        getMonthlyImpactPerRole(role) {
            return this.getWeeklyImpactPerRole(role) * 4.33; // Average weeks per month
        },
        getYearlyImpactPerRole(role) {
            return this.getWeeklyImpactPerRole(role) * 52; // Weeks per year
        },
        updateChart() {
            const ctx = document.getElementById('impactChart');
            if (!ctx) return;

            const weeklyImpact = this.getWeeklyImpact();
            const monthlyImpact = this.getMonthlyImpact();
            const yearlyImpact = this.getYearlyImpact();

            const data = {
                labels: ['Wekelijks', 'Maandelijks', 'Jaarlijks'],
                datasets: [
                    {
                        label: 'Optimistisch (100%)',
                        data: [weeklyImpact, monthlyImpact, yearlyImpact],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1
                    },
                    {
                        label: 'Realistisch (70%)',
                        data: [weeklyImpact * 0.7, monthlyImpact * 0.7, yearlyImpact * 0.7],
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1
                    },
                    {
                        label: 'Conservatief (50%)',
                        data: [weeklyImpact * 0.5, monthlyImpact * 0.5, yearlyImpact * 0.5],
                        backgroundColor: 'rgba(251, 191, 36, 0.8)',
                        borderColor: 'rgb(251, 191, 36)',
                        borderWidth: 1
                    }
                ]
            };

            if (!this.chart) {
                this.chart = new Chart(ctx, {
                    type: 'bar',
                    data: data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        animation: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: (value) => '€' + Math.round(value).toLocaleString()
                                }
                            }
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: (context) => 
                                        `${context.dataset.label}: €${Math.round(context.raw).toLocaleString()}`
                                }
                            }
                        }
                    }
                });
            } else {
                this.chart.data.datasets = data.datasets;
                this.chart.update('none');
            }
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
            const canvas = document.getElementById('impactChart');
            if (canvas) {
                const imgData = canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 15, impactY + 10, 180, 100);
            }

            // Scenarios
            const scenariosY = impactY + 120;
            doc.setFontSize(12);

            // Optimistic Scenario
            doc.text('Optimistisch Scenario (100%)', 20, scenariosY);
            doc.text(`Wekelijks: €${this.formatMoney(this.getWeeklyImpact())}`, 30, scenariosY + 7);
            doc.text(`Maandelijks: €${this.formatMoney(this.getMonthlyImpact())}`, 30, scenariosY + 14);
            doc.text(`Jaarlijks: €${this.formatMoney(this.getYearlyImpact())}`, 30, scenariosY + 21);

            // Realistic Scenario
            doc.text('Realistisch Scenario (70%)', 20, scenariosY + 35);
            doc.text(`Wekelijks: €${this.formatMoney(this.getWeeklyImpact() * 0.7)}`, 30, scenariosY + 42);
            doc.text(`Maandelijks: €${this.formatMoney(this.getMonthlyImpact() * 0.7)}`, 30, scenariosY + 49);
            doc.text(`Jaarlijks: €${this.formatMoney(this.getYearlyImpact() * 0.7)}`, 30, scenariosY + 56);

            // Conservative Scenario
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
        this.$nextTick(() => {
            this.updateChart();
        });
    },
    watch: {
        activities: {
            deep: true,
            handler() {
                requestAnimationFrame(() => {
                    this.updateChart();
                });
            }
        }
    },
    beforeUnmount() {
        if (this.chart) {
            this.chart.destroy();
        }
        if (this.updateChartTimeout) {
            clearTimeout(this.updateChartTimeout);
        }
    }
}).mount('#app');