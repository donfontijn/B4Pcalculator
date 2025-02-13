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
                'BIM Regisseur': { rate: 85, count: 1 },
                'BIM Coordinatoren': { rate: 60, count: 2 },
                'Quality Engineers': { rate: 60, count: 2 },
                'BIM Modelleur - Junior': { rate: 40, count: 8 },
                'BIM Modelleur - Senior': { rate: 55, count: 8 },
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
                frequency: 1,
                workingDaysPerMonth: 16.92,
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
            return Math.round(amount).toLocaleString();
        },
        getDailySaved(activity) {
            return (activity.currentTime - activity.newTime) * activity.frequency;
        },
        calculateImpactPerRole(role) {
            let totalImpact = 0;
            this.activities.forEach(activity => {
                if (activity.role === role) {
                    const savedTimePerDay = this.getDailySaved(activity);
                    const workingDaysPerYear = activity.workingDaysPerMonth * 12;
                    const savedHoursPerYear = (savedTimePerDay * workingDaysPerYear) / 3600;
                    const savings = savedHoursPerYear * this.roles[role].rate;
                    totalImpact += savings;
                }
            });
            return totalImpact / this.roles[role].count; // Per person in role
        },
        getWeeklyImpactPerRole(role) {
            return this.calculateImpactPerRole(role) / 52; // Divide yearly impact by 52 weeks
        },
        getMonthlyImpactPerRole(role) {
            return this.calculateImpactPerRole(role) / 12; // Divide yearly impact by 12 months
        },
        getYearlyImpactPerRole(role) {
            return this.calculateImpactPerRole(role);
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
        calculateImpact() {
            let totalYearlySavings = 0;
            const beschikbaarheidsFactor = this.calculateAvailabilityFactor();

            this.activities.forEach(activity => {
                // Time saved per item in minutes
                const timePerItem = ((activity.currentTime - activity.newTime) / 60);
                
                // Daily savings in hours with availability factor
                const dailySavingsHours = (timePerItem * activity.frequency * beschikbaarheidsFactor) / 60;
                
                // Yearly savings in hours
                const yearlyHours = dailySavingsHours * (activity.workingDaysPerMonth * 12);
                
                // Cost savings (multiply by number of people in role)
                const savings = yearlyHours * this.roles[activity.role].rate * this.roles[activity.role].count;

                console.log('Debug calculation:', {
                    timePerItem,
                    dailySavingsHours,
                    yearlyHours,
                    beschikbaarheidsFactor,
                    rate: this.roles[activity.role].rate,
                    savings
                });

                totalYearlySavings += savings;
            });

            return totalYearlySavings;
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
        getYearlyImpactPerPerson(activity) {
            return this.calculateImpactPerPerson(activity);
        },
        getMonthlyImpactPerPerson(activity) {
            return this.calculateImpactPerPerson(activity) / 12;
        },
        getWeeklyImpactPerPerson(activity) {
            return this.calculateImpactPerPerson(activity) / 52;
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
        updateChart() {
            console.log('Updating chart...');
            const ctx = document.getElementById('impactChart');
            if (!ctx) {
                console.log('Canvas not found');
                return;
            }

            const weeklyImpact = this.getWeeklyImpact();
            const monthlyImpact = this.getMonthlyImpact();
            const yearlyImpact = this.getYearlyImpact();

            console.log('Impacts:', { weeklyImpact, monthlyImpact, yearlyImpact });

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
                console.log('Creating new chart');
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
                console.log('Updating existing chart');
                this.chart.data = data;
                this.chart.update('none');
            }
        },
        downloadPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Title
            doc.setFontSize(20);
            doc.text('B4P Innovatie Impact Calculator Rapport', 20, 20);
            
            // Innovation Name and Date
            doc.setFontSize(12);
            doc.text(`Innovatie: ${this.innovationName || 'Naamloos'}`, 20, 35);
            doc.text(`Gegenereerd op: ${new Date().toLocaleString('nl-NL')}`, 20, 45);
            
            // Activities Table
            const tableData = this.activities.map(activity => [
                activity.name || 'Naamloze activiteit',
                activity.role,
                `${activity.currentTime}s`,
                `${activity.newTime}s`,
                `${activity.frequency}x per dag`,
                `${activity.workingDaysPerMonth} dagen/maand`,
                `${Math.round(this.getDailySaved(activity) / 60)} minuten/dag`
            ]);

            doc.autoTable({
                startY: 55,
                head: [['Activiteit', 'Rol', 'Huidige Tijd', 'Nieuwe Tijd', 'Frequentie', 'Werkdagen', 'Tijdsbesparing']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [0, 101, 163] },
                styles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 30 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 25 },
                    5: { cellWidth: 25 },
                    6: { cellWidth: 30 }
                }
            });

            // Financial Impact Section
            const impactY = doc.previousAutoTable.finalY + 20;
            doc.setFontSize(16);
            doc.text('Financiële Impact', 20, impactY);

            // Impact Scenarios in three columns
            const startY = impactY + 15;
            const columnWidth = 60;
            const leftMargin = 20;

            // Column 1: Optimistic
            doc.setFontSize(12);
            doc.text('Optimistisch (100%)', leftMargin, startY);
            doc.setFontSize(10);
            doc.text(`Wekelijks:`, leftMargin, startY + 7);
            doc.text(`€${this.formatMoney(this.getWeeklyImpact())}`, leftMargin, startY + 12);
            doc.text(`Maandelijks:`, leftMargin, startY + 19);
            doc.text(`€${this.formatMoney(this.getMonthlyImpact())}`, leftMargin, startY + 24);
            doc.text(`Jaarlijks:`, leftMargin, startY + 31);
            doc.text(`€${this.formatMoney(this.getYearlyImpact())}`, leftMargin, startY + 36);

            // Column 2: Realistic
            doc.setFontSize(12);
            doc.text('Realistisch (70%)', leftMargin + columnWidth, startY);
            doc.setFontSize(10);
            doc.text(`Wekelijks:`, leftMargin + columnWidth, startY + 7);
            doc.text(`€${this.formatMoney(this.getWeeklyImpact() * 0.7)}`, leftMargin + columnWidth, startY + 12);
            doc.text(`Maandelijks:`, leftMargin + columnWidth, startY + 19);
            doc.text(`€${this.formatMoney(this.getMonthlyImpact() * 0.7)}`, leftMargin + columnWidth, startY + 24);
            doc.text(`Jaarlijks:`, leftMargin + columnWidth, startY + 31);
            doc.text(`€${this.formatMoney(this.getYearlyImpact() * 0.7)}`, leftMargin + columnWidth, startY + 36);

            // Column 3: Conservative
            doc.setFontSize(12);
            doc.text('Conservatief (50%)', leftMargin + (columnWidth * 2), startY);
            doc.setFontSize(10);
            doc.text(`Wekelijks:`, leftMargin + (columnWidth * 2), startY + 7);
            doc.text(`€${this.formatMoney(this.getWeeklyImpact() * 0.5)}`, leftMargin + (columnWidth * 2), startY + 12);
            doc.text(`Maandelijks:`, leftMargin + (columnWidth * 2), startY + 19);
            doc.text(`€${this.formatMoney(this.getMonthlyImpact() * 0.5)}`, leftMargin + (columnWidth * 2), startY + 24);
            doc.text(`Jaarlijks:`, leftMargin + (columnWidth * 2), startY + 31);
            doc.text(`€${this.formatMoney(this.getYearlyImpact() * 0.5)}`, leftMargin + (columnWidth * 2), startY + 36);

            // Save the PDF
            const cleanFileName = (this.innovationName || 'innovatie')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            
            doc.save(`${cleanFileName}-impact-rapport.pdf`);
        },
        getTotalImpactForRole(role) {
            return this.activities
                .filter(activity => activity.role === role)
                .reduce((total, activity) => total + this.calculateImpactPerPerson(activity), 0);
        },
        getWeeklyTotalForRole(role) {
            return this.getTotalImpactForRole(role) / 52;
        },
        getMonthlyTotalForRole(role) {
            return this.getTotalImpactForRole(role) / 12;
        },
        getYearlyTotalForRole(role) {
            return this.getTotalImpactForRole(role);
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