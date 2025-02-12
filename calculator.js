<script>
function renderChart(data) {
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = Recharts;
    
    const chart = React.createElement(LineChart, {
        width: 800,
        height: 300,
        data: data,
        margin: { top: 5, right: 30, left: 20, bottom: 5 }
    }, [
        React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
        React.createElement(XAxis, { dataKey: "period" }),
        React.createElement(YAxis, { label: { value: 'Impact (€)', angle: -90, position: 'insideLeft' } }),
        React.createElement(Tooltip, { formatter: (value) => ["€" + value.toLocaleString()] }),
        React.createElement(Legend),
        React.createElement(Line, {
            type: "monotone",
            dataKey: "optimistic",
            stroke: "#3B82F6",
            name: "Optimistisch (100%)"
        }),
        React.createElement(Line, {
            type: "monotone",
            dataKey: "realistic",
            stroke: "#10B981",
            name: "Realistisch (70%)"
        }),
        React.createElement(Line, {
            type: "monotone",
            dataKey: "conservative",
            stroke: "#FBBF24",
            name: "Conservatief (50%)"
        })
    ]);

    ReactDOM.render(chart, document.getElementById('scenarioChart'));
}

// Watch for changes in the Vue app's chartData
const app = document.querySelector('#app').__vue_app__;
app.config.globalProperties.$watch('chartData', (newData) => {
    renderChart(newData);
}, { deep: true, immediate: true });
</script>
