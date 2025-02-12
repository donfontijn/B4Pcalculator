const { createApp } = Vue;

createApp({
    data() {
        return {
            innovationName: '',
            activities: [],
            roles: {
                'BIM Regisseur': { rate: 85, count: 1 },
                'BIM Coordinatoren': { rate: 60, count: 2 },
                'Quality Engineers': { rate: 55, count: 2 },
                'BIM Modelleur - Junior': { rate: 40, count: 8 },
                'BIM Modelleur - Senior': { rate: 55, count: 8 },
                'Projectmanagers': { rate: 55, count: 2 },
                'Softwaredeveloper': { rate: 55, count: 1 }
            },
            chartData: []
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
            this.chartData = [
                { period: 'Week', optimistic: Math.round(yearlyImpact / 52), realistic: Math.round(yearlyImpact * 0.7 / 52), conservative: Math.round(yearlyImpact * 0.5 / 52) },
                { period: 'Month', optimistic: Math.round(yearlyImpact / 12), realistic: Math.round(yearlyImpact * 0.7 / 12), conservative: Math.round(yearlyImpact * 0.5 / 12) },
                { period: 'Year', optimistic: Math.round(yearlyImpact), realistic: Math.round(yearlyImpact * 0.7), conservative: Math.round(yearlyImpact * 0.5) }
            ];
        },
        downloadPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Title
            doc.setFontSize(20);
            doc.text('B4P Innovation Impact Calculator Report', 20, 20);
            
            // Innovation Name
            doc.setFontSize(16);
            doc.text(`Innovation: ${this.innovationName || 'Untitled'}`, 20, 35);
            
            // Date
            doc.setFontSize(12);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
            
            // Activities Table
            const tableData = this.activities.map(activity => [
                activity.name || 'Unnamed activity',
                activity.role,
                this.formatTime(activity.currentTime),
                this.formatTime(activity.newTime),
                activity.frequency + 'x/day',
                activity.workingDaysPerMonth + ' days/month',
                Math.round(this.getDailySaved(activity) / 60) + ' minutes/day'
            ]);

            doc.autoTable({
                startY: 55,
                head: [['Activity', 'Role', 'Current Time', 'New Time', 'Frequency', 'Working Days', 'Time Saved']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] }
            });

            // Financial Impact
            const impactY = doc.previousAutoTable.finalY + 20;
            doc.setFontSize(16);
            doc.text('Financial Impact', 20, impactY);

            // Scenarios
            doc.setFontSize(12);
            doc.text('Optimistic Scenario (100%)', 20, impactY + 15);
            doc.text(`Weekly Impact: €${this.formatMoney(this.getWeeklyImpact())}`, 30, impactY + 22);
            doc.text(`Monthly Impact: €${this.formatMoney(this.getMonthlyImpact())}`, 30, impactY + 29);
            doc.text(`Yearly Impact: €${this.formatMoney(this.getYearlyImpact())}`, 30, impactY + 36);

            doc.text('Realistic Scenario (70%)', 20, impactY + 46);
            doc.text(`Weekly Impact: €${this.formatMoney(this.getWeeklyImpact() * 0.7)}`, 30, impactY + 53);
            doc.text(`Monthly Impact: €${this.formatMoney(this.getMonthlyImpact() * 0.7)}`, 30, impactY + 60);
            doc.text(`Yearly Impact: €${this.formatMoney(this.getYearlyImpact() * 0.7)}`, 30, impactY + 67);

            doc.text('Conservative Scenario (50%)', 20, impactY + 77);
            doc.text(`Weekly Impact: €${this.formatMoney(this.getWeeklyImpact() * 0.5)}`, 30, impactY + 84);
            doc.text(`Monthly Impact: €${this.formatMoney(this.getMonthlyImpact() * 0.5)}`, 30, impactY + 91);
            doc.text(`Yearly Impact: €${this.formatMoney(this.getYearlyImpact() * 0.5)}`, 30, impactY + 98);

            // Additional Information
            doc.setFontSize(10);
            doc.text('Calculation based on:', 20, impactY + 108);
            doc.text('- Individual working days per month for each activity', 25, impactY + 115);
            doc.text('- Hourly rates per role', 25, impactY + 122);
            doc.text('- Three scenarios: optimistic (100%), realistic (70%), conservative (50%)', 25, impactY + 129);
            
            // Ensure a clean filename by removing special characters
            const cleanFileName = (this.innovationName || 'unnamed-innovation')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
                
            doc.save(`${cleanFileName}-impact-report.pdf`);
        }
    },
    mounted() {
        this.addActivity();
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
