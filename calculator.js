<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>B4P Innovation Impact Calculator</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
</head>
<body class="bg-gray-100 min-h-screen p-8">
    <div id="app" class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-6">
            <h1 class="text-2xl font-bold mb-6">B4P Innovation Impact Calculator</h1>
            
            <div class="mb-6">
                <label class="block text-sm font-medium mb-2">Innovation Name</label>
                <input type="text" v-model="innovationName" class="w-full p-2 border rounded" placeholder="Enter innovation name">
            </div>

            <div class="space-y-6">
                <div v-for="(activity, index) in activities" :key="index" class="border p-4 rounded-lg bg-gray-50">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-medium">Activity {{index + 1}}</h3>
                        <button @click="removeActivity(index)" class="text-red-500 hover:text-red-700">Remove</button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Activity Name</label>
                            <input type="text" v-model="activity.name" class="w-full p-2 border rounded" placeholder="Enter activity name">
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">Role</label>
                            <select v-model="activity.role" @change="activity.peopleCount = roles[activity.role].count" class="w-full p-2 border rounded">
                                <option v-for="(roleData, role) in roles" :value="role">{{role}} ({{roleData.count}} people)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">
                                Number of People
                                <input 
                                    type="number" 
                                    v-model="activity.peopleCount" 
                                    class="w-full p-2 border rounded"
                                    min="1"
                                >
                            </label>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">
                                Current Time ({{formatTime(activity.currentTime)}})
                            </label>
                            <input type="range" v-model="activity.currentTime" :min="10" :max="600" class="w-full">
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">
                                Time After Innovation ({{formatTime(activity.newTime)}})
                            </label>
                            <input type="range" v-model="activity.newTime" :min="0" :max="activity.currentTime" class="w-full">
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">
                                Frequency per Day
                                <input 
                                    type="number" 
                                    v-model="activity.frequency" 
                                    class="w-full p-2 border rounded"
                                    min="1"
                                    placeholder="Enter times per day"
                                >
                            </label>
                        </div>

                        <div>
                            <label class="block text-sm font-medium mb-2">
                                Average Days per Month this Activity is Executed ({{activity.workingDaysPerMonth}} days)
                            </label>
                            <input type="range" v-model="activity.workingDaysPerMonth" :min="1" :max="23" class="w-full">
                        </div>
                    </div>

                    <div class="mt-2 text-sm text-gray-600">
                        Daily time saved: {{Math.round(((activity.currentTime - activity.newTime) * activity.frequency) / 60)}} minutes
                    </div>
                </div>
            </div>

            <button @click="addActivity" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Add Activity
            </button>

            <button @click="downloadPDF" class="mt-4 ml-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Download PDF Report
            </button>

            <div class="mt-8 bg-blue-50 p-4 rounded-lg">
                <h3 class="font-medium mb-4">Business Case Impact</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p class="text-sm text-gray-600">Weekly Impact</p>
                        <p class="text-lg font-medium">€{{formatMoney(getWeeklyImpact())}}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Monthly Impact</p>
                        <p class="text-lg font-medium">€{{formatMoney(getMonthlyImpact())}}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Yearly Impact</p>
                        <p class="text-lg font-medium">€{{formatMoney(getYearlyImpact())}}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="calculator.js"></script>
</body>
</html>
