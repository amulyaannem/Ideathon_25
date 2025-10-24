// Carbon footprint calculation constants (kg CO2 equivalent)
const CARBON_FACTORS = {
    transportation: {
        car: 0.21, // kg CO2 per km
        bus: 0.08, // kg CO2 per km
        bike: 0, // kg CO2 per km
        motorcycle: 0.11 // kg CO2 per km
    },
    diet: {
        high: 3.3, // kg CO2 per day
        medium: 2.2,
        low: 1.5,
        none: 1.1
    },
    energy: {
        electricity: 0.5, // kg CO2 per kWh (average grid)
        heating: {
            naturalGas: 2.0, // kg CO2 per day (average)
            electric: 1.5,
            renewable: 0.3
        }
    },
    lifestyle: {
        flights: 90, // kg CO2 per hour
        shopping: {
            high: 10, // kg CO2 per day
            medium: 5,
            low: 2
        }
    }
};

// Global average carbon footprint (kg CO2 per day)
const GLOBAL_AVERAGE = 16.4; // Approximately 6 tons per year / 365 days

// DOM Elements
const calculateBtn = document.getElementById('calculateBtn');
const visualizationSection = document.getElementById('visualization');
const mainChart = document.getElementById('mainChart');
const comparisonChart = document.getElementById('comparisonChart');
const impactChart = document.getElementById('impactChart');
const insightsContainer = document.getElementById('insights');
const localFoodSlider = document.getElementById('localFood');
const localFoodValue = document.getElementById('localFoodValue');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Update local food percentage display
    localFoodSlider.addEventListener('input', function() {
        localFoodValue.textContent = `${this.value}%`;
    });
    
    // Calculate button event listener
    calculateBtn.addEventListener('click', calculateFootprint);
});

// Calculate carbon footprint based on user inputs
function calculateFootprint() {
    // Show calculating animation
    calculateBtn.classList.add('calculating');
    calculateBtn.textContent = 'Calculating...';
    
    // Simulate calculation delay for better UX
    setTimeout(() => {
        // Get user inputs
        const commuteDistance = parseFloat(document.getElementById('commuteDistance').value) || 0;
        const vehicleType = document.getElementById('vehicleType').value;
        const meatConsumption = document.getElementById('meatConsumption').value;
        const localFoodPercentage = parseInt(document.getElementById('localFood').value);
        const electricityUsage = parseFloat(document.getElementById('electricityUsage').value) || 0;
        const heatingType = document.getElementById('heatingType').value;
        const flightHours = parseFloat(document.getElementById('flightHours').value) || 0;
        const shoppingHabits = document.getElementById('shoppingHabits').value;
        
        // Calculate emissions by category
        const transportEmissions = commuteDistance * CARBON_FACTORS.transportation[vehicleType];
        const dietEmissions = CARBON_FACTORS.diet[meatConsumption] * (1 - localFoodPercentage/200); // Local food reduces emissions
        const energyEmissions = (electricityUsage / 30 * CARBON_FACTORS.energy.electricity) + 
                               CARBON_FACTORS.energy.heating[heatingType];
        const lifestyleEmissions = (flightHours / 365 * CARBON_FACTORS.lifestyle.flights) + 
                                  CARBON_FACTORS.lifestyle.shopping[shoppingHabits];
        
        const totalEmissions = transportEmissions + dietEmissions + energyEmissions + lifestyleEmissions;
        
        // Prepare data for visualization
        const userData = [
            { category: 'Transport', emissions: transportEmissions },
            { category: 'Diet', emissions: dietEmissions },
            { category: 'Energy', emissions: energyEmissions },
            { category: 'Lifestyle', emissions: lifestyleEmissions }
        ];
        
        // Show visualization section
        visualizationSection.classList.remove('hidden');
        
        // Create visualizations
        createMainChart(userData);
        createComparisonChart(totalEmissions);
        createImpactChart(userData, totalEmissions);
        generateInsights(userData, totalEmissions);
        
        // Reset button
        calculateBtn.classList.remove('calculating');
        calculateBtn.textContent = 'Calculate My Carbon Footprint';
        
        // Scroll to visualization
        visualizationSection.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
}

// Create main bar chart showing emissions by category
function createMainChart(data) {
    // Clear previous chart
    mainChart.innerHTML = '';
    
    // Set up dimensions
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = mainChart.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(mainChart)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Set up scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.category))
        .range([0, width])
        .padding(0.2);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.emissions) * 1.1])
        .range([height, 0]);
    
    // Create bars
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.category))
        .attr('y', d => y(d.emissions))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.emissions))
        .attr('fill', (d, i) => {
            const colors = ['#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6'];
            return colors[i % colors.length];
        })
        .on('mouseover', function(event, d) {
            // Highlight bar on hover
            d3.select(this).attr('opacity', 0.8);
            
            // Show tooltip
            const tooltip = d3.select(mainChart)
                .append('div')
                .attr('class', 'absolute bg-gray-800 text-white p-2 rounded text-sm')
                .style('opacity', 0);
            
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
                
            tooltip.html(`${d.category}: ${d.emissions.toFixed(2)} kg CO₂`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            d3.selectAll('.tooltip').remove();
        });
    
    // Add x-axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));
    
    // Add y-axis
    svg.append('g')
        .call(d3.axisLeft(y));
    
    // Add y-axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .style('fill', '#6B7280')
        .text('kg CO₂ per day');
}

// Create comparison chart between user and global average
function createComparisonChart(userTotal) {
    // Clear previous chart
    comparisonChart.innerHTML = '';
    
    // Prepare data
    const data = [
        { label: 'Your Footprint', value: userTotal },
        { label: 'Global Average', value: GLOBAL_AVERAGE }
    ];
    
    // Set up dimensions
    const width = comparisonChart.clientWidth;
    const height = 200;
    const radius = Math.min(width, height) / 2 - 10;
    
    // Create SVG
    const svg = d3.select(comparisonChart)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width/2},${height/2})`);
    
    // Set up color scale
    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.label))
        .range(['#10B981', '#6B7280']);
    
    // Create pie chart
    const pie = d3.pie()
        .value(d => d.value)
        .sort(null);
    
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
    
    // Draw arcs
    const arcs = svg.selectAll('arc')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('class', 'arc');
    
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.label))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
    
    // Add labels
    arcs.append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', 'white')
        .text(d => `${d.data.label}: ${d.data.value.toFixed(1)} kg`);
    
    // Add comparison text
    const comparisonText = document.createElement('div');
    comparisonText.className = 'text-center mt-4';
    
    if (userTotal < GLOBAL_AVERAGE) {
        comparisonText.innerHTML = `<p class="text-green-600 font-semibold">Great job! Your footprint is ${(GLOBAL_AVERAGE - userTotal).toFixed(1)} kg lower than average.</p>`;
    } else {
        comparisonText.innerHTML = `<p class="text-red-600 font-semibold">Your footprint is ${(userTotal - GLOBAL_AVERAGE).toFixed(1)} kg higher than average.</p>`;
    }
    
    comparisonChart.appendChild(comparisonText);
}

// Create chart showing impact of sustainable changes
function createImpactChart(userData, userTotal) {
    // Clear previous chart
    impactChart.innerHTML = '';
    
    // Calculate potential reductions
    const transportReduction = userData[0].emissions * 0.5; // 50% reduction by using public transport
    const dietReduction = userData[1].emissions * 0.3; // 30% reduction by eating less meat
    const energyReduction = userData[2].emissions * 0.2; // 20% reduction by saving energy
    
    const potentialTotal = userTotal - (transportReduction + dietReduction + energyReduction);
    
    // Prepare data
    const data = [
        { label: 'Current', value: userTotal },
        { label: 'With Changes', value: potentialTotal }
    ];
    
    // Set up dimensions
    const width = impactChart.clientWidth;
    const height = 200;
    
    // Create SVG
    const svg = d3.select(impactChart)
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Set up scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([0, width])
        .padding(0.3);
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) * 1.1])
        .range([height - 30, 0]);
    
    // Create bars
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.label))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => height - 30 - y(d.value))
        .attr('fill', (d, i) => i === 0 ? '#EF4444' : '#10B981');
    
    // Add labels
    svg.selectAll('.label')
        .data(data)
        .enter()
        .append('text')
        .attr('x', d => x(d.label) + x.bandwidth() / 2)
        .attr('y', d => y(d.value) - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', '#374151')
        .text(d => `${d.value.toFixed(1)} kg`);
    
    // Add x-axis
    svg.append('g')
        .attr('transform', `translate(0,${height - 30})`)
        .call(d3.axisBottom(x));
    
    // Add reduction percentage
    const reductionPercentage = ((userTotal - potentialTotal) / userTotal * 100).toFixed(1);
    const reductionText = document.createElement('div');
    reductionText.className = 'text-center mt-2';
    reductionText.innerHTML = `<p class="text-green-600 font-semibold">Potential reduction: ${reductionPercentage}%</p>`;
    
    impactChart.appendChild(reductionText);
}

// Generate actionable insights based on user data
function generateInsights(userData, totalEmissions) {
    insightsContainer.innerHTML = '';
    
    const insights = [];
    
    // Transportation insights
    if (userData[0].emissions > 3) {
        insights.push({
            text: "Consider using public transport or carpooling to reduce your transport emissions.",
            impact: "Could reduce transport emissions by up to 50%"
        });
    }
    
    // Diet insights
    if (userData[1].emissions > 2) {
        insights.push({
            text: "Reducing meat consumption, especially red meat, can significantly lower your dietary carbon footprint.",
            impact: "Vegetarian diet could reduce food emissions by 30-50%"
        });
    }
    
    // Energy insights
    if (userData[2].emissions > 4) {
        insights.push({
            text: "Switch to energy-efficient appliances and consider renewable energy sources for your home.",
            impact: "Could reduce energy emissions by 20-30%"
        });
    }
    
    // General insights based on total
    if (totalEmissions > GLOBAL_AVERAGE) {
        insights.push({
            text: "Your carbon footprint is above the global average. Small changes in multiple areas can make a big difference.",
            impact: "Aim to reduce by 10-20% in the next 6 months"
        });
    } else {
        insights.push({
            text: "Great job! Your carbon footprint is below the global average. Keep up the sustainable habits!",
            impact: "Consider inspiring others with your eco-friendly choices"
        });
    }
    
    // Add insights to the container
    insights.forEach(insight => {
        const insightElement = document.createElement('div');
        insightElement.className = 'insight-card';
        insightElement.innerHTML = `
            <p class="font-medium">${insight.text}</p>
            <p class="text-sm text-gray-600 mt-1">${insight.impact}</p>
        `;
        insightsContainer.appendChild(insightElement);
    });
    
    // If no specific insights, show a general message
    if (insights.length === 0) {
        insightsContainer.innerHTML = `
            <div class="text-center py-4 text-gray-600">
                <p>Your carbon footprint is already quite low! Keep up the good work.</p>
            </div>
        `;
    }
}