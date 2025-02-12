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
                this.formatTime(this.getDailySaved(activity)) + '/day'
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

            doc.setFontSize(12);
            doc.text(`Weekly Impact: €${this.formatMoney(this.getWeeklyImpact())}`, 20, impactY + 10);
            doc.text(`Monthly Impact: €${this.formatMoney(this.getMonthlyImpact())}`, 20, impactY + 20);
            doc.text(`Yearly Impact: €${this.formatMoney(this.getYearlyImpact())}`, 20, impactY + 30);

            // Additional Information
            doc.setFontSize(10);
            doc.text('Calculation based on:', 20, impactY + 45);
            doc.text('- Individual working days per month for each activity', 25, impactY + 52);
            doc.text('- Hourly rates per role', 25, impactY + 59);
            
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
    }
}).mount('#app');
