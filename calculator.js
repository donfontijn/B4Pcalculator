const { createApp } = Vue;

createApp({
    data() {
        return {
            innovationName: '',
            activities: [],
            roles: {
                'BIM Regisseur': 85,
                'BIM Coordinatoren': 60,
                'Quality Engineers': 55,
                'BIM Modelleur - Junior': 40,
                'BIM Modelleur - Senior': 55,
                'Teamcaptains': 55,
                'Softwaredeveloper': 55
            }
        }
    },
    methods: {
        addActivity() {
            this.activities.push({
                name: '',
                role: Object.keys(this.roles)[0],
                currentTime: 30,
                newTime: 15,
                frequency: 1
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
            const workingDaysPerYear = 230;
            const workingDaysPerWeek = 5;
            let totalYearlySavings = 0;

            this.activities.forEach(activity => {
                const savedTimePerDay = this.getDailySaved(activity);
                const savedHoursPerYear = (savedTimePerDay * workingDaysPerYear) / 3600; // Convert seconds to hours
                const savings = savedHoursPerYear * this.roles[activity.role];
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
            const workingDaysPerYear = 230;
            const workingDaysPerWeek = 5;
            return this.calculateImpact() / (workingDaysPerYear / workingDaysPerWeek);
        }
    },
    mounted() {
        this.addActivity();
    }
}).mount('#app');
