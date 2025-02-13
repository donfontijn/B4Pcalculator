const { createApp } = Vue;

createApp({
    data() {
        return {
            innovationName: '',
            activities: [],
            chart: null,
            updateChartTimeout: null,
            showInfo: false,
            roles: {
                'BIM Regisseur': { rate: 85, count: 1.5 },
                'BIM Coordinatoren': { rate: 60, count: 2 },
                'Quality Engineers': { rate: 60, count: 1.5 },
                'BIM Modelleur': { rate: 46.42, count: 15 },
                'Teamcaptain': { rate: 60, count: 2 },
                'Projectmanagers': { rate: 55, count: 2 },
                'Softwaredeveloper': { rate: 55, count: 1 }
            },
            // Availability calculation factors
            availabilityFactors: {
                totalWorkDaysPerYear: 260,
                hoursPerDay: 8,
                nationalHolidays: 48,    // hours
                leaveHours: 200,         // vacation/ADV hours
                sicknessPercentage: 5,   // 5%
                otherUnavailablePercentage: 5  // 5%
            }
        }
    },
    methods: {
        addActivity() {
            this.activities.push({
                id: Date.now(),
                name: '',
                role: Object.keys(this.roles)[0],
                currentTime: 0,
                newTime: 0,
                frequency: 0,
                workingDaysPerMonth: 0,  // Set default to 0
                showSettings: false,
                showImpact: false
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
            return Math.round(amount).toLocaleString('nl-NL');
        },
        getDailySaved(activity) {
            return (activity.currentTime - activity.newTime) * activity.frequency;
        },
        calculateBaseImpact(activity) {
            if (!activity || !activity.role || !this.roles[activity.role]) return 0;
            const timePerItem = ((activity.currentTime - activity.newTime) / 3600);
            const dailySavingsHours = timePerItem * activity.frequency * 0.8;
            const yearlyHours = dailySavingsHours * (activity.workingDaysPerMonth * 12);
            return yearlyHours * this.roles[activity.role].rate;
        },
        getWeeklyImpactPerPerson(activity) {
            return (this.calculateBaseImpact(activity) * 0.7) / 52;
        },
        getMonthlyImpactPerPerson(activity) {
            return (this.calculateBaseImpact(activity) * 0.7) / 12;
        },
        getYearlyImpactPerPerson(activity) {
            if (!activity || !activity.role) return 0;
            const baseImpact = this.calculateBaseImpact(activity);
            return baseImpact * this.roles[activity.role].count * 0.7;
        },
        getYearlyImpact() {
            return this.activities.reduce((sum, activity) => {
                const baseImpact = this.calculateBaseImpact(activity);
                return sum + (baseImpact * this.roles[activity.role].count);
            }, 0) * 0.7;
        },
        getMonthlyImpact() {
            return this.getYearlyImpact() / 12;
        },
        getWeeklyImpact() {
            return this.getYearlyImpact() / 52;
        },
        getYearlyTotalForRole(role) {
            if (!role || !this.roles[role]) return 0;
            return this.activities
                .filter(a => a.role === role)
                .reduce((sum, activity) => {
                    return sum + this.calculateBaseImpact(activity);
                }, 0) * 0.7;
        },
        getMonthlyTotalForRole(role) {
            return this.getYearlyTotalForRole(role) / 12;
        },
        getWeeklyTotalForRole(role) {
            return this.getYearlyTotalForRole(role) / 52;
        },
        getYearlyPerPersonForRole(role) {
            return this.getYearlyTotalForRole(role) / this.roles[role].count;  // €9,663 / 1.5 = €6,442
        },
        getMonthlyPerPersonForRole(role) {
            return this.getMonthlyTotalForRole(role) / this.roles[role].count;
        },
        getWeeklyPerPersonForRole(role) {
            return this.getWeeklyTotalForRole(role) / this.roles[role].count;
        },
        calculateAvailabilityFactor() {
            const totalYearlyHours = this.availabilityFactors.totalWorkDaysPerYear * this.availabilityFactors.hoursPerDay;
            
            // Calculate deductions
            const sickHours = (totalYearlyHours * this.availabilityFactors.sicknessPercentage) / 100;
            const otherUnavailableHours = (totalYearlyHours * this.availabilityFactors.otherUnavailablePercentage) / 100;
            const totalDeductions = this.availabilityFactors.nationalHolidays + 
                                  this.availabilityFactors.leaveHours + 
                                  sickHours + 
                                  otherUnavailableHours;

            // Calculate net available hours
            const netAvailableHours = totalYearlyHours - totalDeductions;
            
            console.log('Availability calculation:', {
                totalYearlyHours,
                deductions: {
                    nationalHolidays: this.availabilityFactors.nationalHolidays,
                    leaveHours: this.availabilityFactors.leaveHours,
                    sickHours,
                    otherUnavailableHours,
                    total: totalDeductions
                },
                netAvailableHours,
                factor: netAvailableHours / totalYearlyHours
            });

            return netAvailableHours / totalYearlyHours;
        },
        calculateImpactPerPerson(activity) {
            const beschikbaarheidsFactor = this.calculateAvailabilityFactor();
            const werkdagenCorrectionFactor = 16.92/20; // Correct for max 20 days in frontend
            
            // Time saved per item in minutes
            const timePerItem = ((activity.currentTime - activity.newTime) / 60);
            
            // Daily savings in hours with availability factor
            const dailySavingsHours = (timePerItem * activity.frequency * beschikbaarheidsFactor) / 60;
            
            // Yearly savings in hours (using corrected working days)
            const yearlyHours = dailySavingsHours * (activity.workingDaysPerMonth * werkdagenCorrectionFactor * 12);
            
            // Cost savings (single person)
            return yearlyHours * this.roles[activity.role].rate;
        },
        updateChart() {
            console.log('Updating chart...');
            const ctx = document.getElementById('impactChart');
            if (!ctx) {
                console.log('Canvas not found');
                return;
            }

            const yearlyImpact = this.getYearlyImpact();
            const monthlyImpact = yearlyImpact / 12;
            const weeklyImpact = yearlyImpact / 52;

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

            if (this.chart) {
                this.chart.data = data;
                this.chart.update('none');
            } else {
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
            }
        },
        downloadPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Get the PDF template
            const template = document.getElementById('pdf-template');
            
            // Generate PDF using the template
            doc.html(template, {
                callback: function (doc) {
                    // Save the PDF
                    const cleanFileName = (this.innovationName || 'innovatie')
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '');
                    
                    doc.save(`${cleanFileName}-impact-rapport.pdf`);
                },
                x: 15,
                y: 15
            });
        },
        getTotalImpactForRole(role) {
            return this.activities
                .filter(activity => activity.role === role)
                .reduce((total, activity) => total + this.calculateImpactPerPerson(activity), 0);
        },
        getMonthlyFromYearly(amount) {
            return amount / 12;
        },
        getWeeklyFromYearly(amount) {
            return amount / 52;
        }
    },
    mounted() {
        console.log('Component mounted');
        this.addActivity();
        this.$nextTick(() => {
            this.updateChart();
        });
        
        // Add click outside handler for info popup
        document.addEventListener('click', (e) => {
            const infoButton = e.target.closest('button');
            const infoPopover = e.target.closest('.relative');
            if (!infoButton && !infoPopover && this.showInfo) {
                this.showInfo = false;
            }
        });
    },
    watch: {
        activities: {
            deep: true,
            handler(newVal) {
                console.log('Activities changed');
                // Clear existing chart
                if (this.chart) {
                    this.chart.destroy();
                    this.chart = null;
                }
                // Create new chart
                this.$nextTick(() => {
                    this.updateChart();
                });
            }
        },
        'activities.*.currentTime': function() {
            this.updateChart();
        },
        'activities.*.newTime': function() {
            this.updateChart();
        },
        'activities.*.frequency': function() {
            this.updateChart();
        },
        'activities.*.workingDaysPerMonth': function() {
            this.updateChart();
        }
    },
    beforeUnmount() {
        if (this.chart) {
            this.chart.destroy();
        }
        if (this.updateChartTimeout) {
            clearTimeout(this.updateChartTimeout);
        }
        document.removeEventListener('click', this.handleClickOutside);
    }
}).mount('#app');