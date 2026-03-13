// ===== AWS Pricing Data (approximate, publicly available) =====
const PRICING = {
    // EC2 on-demand hourly pricing (us-east-1, Linux)
    ec2: {
        't3.micro':   0.0104,
        't3.small':   0.0208,
        't3.medium':  0.0416,
        't3.large':   0.0832,
        'm5.large':   0.096,
        'm5.xlarge':  0.192,
    },
    // RDS on-demand hourly pricing (us-east-1, MySQL, Single-AZ)
    rds: {
        'db.t3.micro':  0.017,
        'db.t3.small':  0.034,
        'db.t3.medium': 0.068,
        'db.r5.large':  0.24,
    },
    rdsStoragePerGB: 0.115,          // gp2 per GB/month
    s3StoragePerGB: 0.023,           // Standard, first 50 TB
    s3PutPer1000: 0.005,
    s3GetPer1000: 0.0004,
    cloudFrontPerGB: 0.085,          // first 10 TB
    cloudFrontPerRequest: 0.0000010, // HTTPS
    lambdaPerRequest: 0.0000002,     // $0.20 per 1M
    lambdaPerGBSecond: 0.0000166667, // 128 MB default
    apiGatewayPerRequest: 0.0000035, // REST API, $3.50 per million
    dynamoDBWritePerUnit: 0.00000125,  // $1.25 per million WCU
    dynamoDBReadPerUnit: 0.00000025,   // $0.25 per million RCU
    dynamoDBStoragePerGB: 0.25,
    albHourly: 0.0225,
    albPerLCU: 0.008,
    ecsFargateCPUPerHour: 0.04048,   // per vCPU per hour
    ecsFargateMemPerGBHour: 0.004445,
    sagemakerPerHour: {
        'ml.t3.medium':  0.05,
        'ml.m5.large':   0.115,
        'ml.m5.xlarge':  0.23,
        'ml.g4dn.xlarge': 0.736,
    },
    gluePerDPU: 0.44,               // per DPU-hour
    athenaPerTBScanned: 5.00,
    dataTransferPerGB: 0.09,         // first 10 TB out to internet
};

// ===== Free Tier Limits =====
const FREE_TIER = {
    ec2Hours: 750,           // t2.micro or t3.micro, 12 months
    rdsHours: 750,           // db.t2.micro or db.t3.micro, 12 months
    s3StorageGB: 5,
    s3PutRequests: 2000,
    s3GetRequests: 20000,
    cloudFrontGB: 1000,      // 1 TB/month always free
    cloudFrontRequests: 10000000,
    lambdaRequests: 1000000,
    lambdaGBSeconds: 400000,
    apiGatewayRequests: 1000000, // 12 months
    dynamoDBWriteUnits: 25,      // always free (25 WCU provisioned)
    dynamoDBReadUnits: 25,       // always free (25 RCU provisioned)
    dynamoDBStorageGB: 25,
    dataTransferGB: 100,         // 100 GB/month always free (aggregate)
};

// ===== Architecture Definitions =====
const ARCHITECTURES = {
    'static-website': {
        name: 'Static Website',
        services: ['S3', 'CloudFront', 'Data Transfer'],
        sliders: [
            { id: 'requests', label: 'Page Views / Month', min: 1000, max: 10000000, default: 100000, step: 1000, format: 'number' },
            { id: 'storage', label: 'Storage (GB)', min: 0.1, max: 100, default: 1, step: 0.1, format: 'gb' },
            { id: 'transfer', label: 'Data Transfer Out (GB)', min: 0.1, max: 1000, default: 10, step: 0.1, format: 'gb' },
        ],
        calculate: function(params) {
            const s3Storage = Math.max(0, params.storage - FREE_TIER.s3StorageGB) * PRICING.s3StoragePerGB;
            const s3Puts = 1000; // assume ~1000 puts/month for updates
            const s3PutCost = Math.max(0, s3Puts - FREE_TIER.s3PutRequests) * PRICING.s3PutPer1000 / 1000;
            const s3Gets = params.requests * 0.1; // 10% origin fetches
            const s3GetCost = Math.max(0, s3Gets - FREE_TIER.s3GetRequests) * PRICING.s3GetPer1000 / 1000;
            const s3Total = s3Storage + s3PutCost + s3GetCost;

            const cfTransfer = Math.max(0, params.transfer - FREE_TIER.cloudFrontGB) * PRICING.cloudFrontPerGB;
            const cfRequests = Math.max(0, params.requests - FREE_TIER.cloudFrontRequests) * PRICING.cloudFrontPerRequest;
            const cfTotal = cfTransfer + cfRequests;

            const dtCost = Math.max(0, params.transfer - FREE_TIER.dataTransferGB) * PRICING.dataTransferPerGB;

            return [
                { service: 'S3', cost: s3Total },
                { service: 'CloudFront', cost: cfTotal },
                { service: 'Data Transfer', cost: dtCost },
            ];
        },
        freeTier: [
            { service: 'S3', text: '5 GB storage, 2,000 PUT, 20,000 GET requests free', status: 'covered' },
            { service: 'CloudFront', text: '1 TB transfer, 10M requests/month always free', status: 'covered' },
            { service: 'Data Transfer', text: '100 GB/month free (aggregate across services)', status: 'partial' },
        ],
        tips: [
            { icon: '$', text: 'Enable CloudFront caching with long TTLs to reduce S3 origin requests and transfer costs.', savings: 'Save 30-50% on transfer' },
            { icon: '*', text: 'Use S3 Intelligent-Tiering for sites with unpredictable access patterns -- it automatically moves objects to cheaper tiers.', savings: 'Save up to 40% on storage' },
            { icon: '>', text: 'Compress assets with gzip/brotli. CloudFront supports automatic compression for common file types.', savings: 'Save 60-80% on transfer' },
        ],
    },
    'api-backend': {
        name: 'API Backend',
        services: ['Lambda', 'API Gateway', 'DynamoDB', 'Data Transfer'],
        sliders: [
            { id: 'requests', label: 'API Requests / Month', min: 1000, max: 100000000, default: 1000000, step: 1000, format: 'number' },
            { id: 'storage', label: 'DynamoDB Storage (GB)', min: 0.1, max: 500, default: 5, step: 0.1, format: 'gb' },
            { id: 'transfer', label: 'Data Transfer Out (GB)', min: 0.1, max: 500, default: 5, step: 0.1, format: 'gb' },
        ],
        calculate: function(params) {
            const lambdaRequests = Math.max(0, params.requests - FREE_TIER.lambdaRequests) * PRICING.lambdaPerRequest;
            const lambdaDuration = params.requests * 0.2; // 200ms avg, 128MB
            const lambdaGBSec = lambdaDuration * 0.125; // 128MB = 0.125 GB
            const lambdaCompute = Math.max(0, lambdaGBSec - FREE_TIER.lambdaGBSeconds) * PRICING.lambdaPerGBSecond;
            const lambdaTotal = lambdaRequests + lambdaCompute;

            const apigwRequests = Math.max(0, params.requests - FREE_TIER.apiGatewayRequests) * PRICING.apiGatewayPerRequest;

            // Assume 50% writes, 50% reads
            const writeRequests = params.requests * 0.5;
            const readRequests = params.requests * 0.5;
            const dynamoWrites = writeRequests * PRICING.dynamoDBWritePerUnit;
            const dynamoReads = readRequests * PRICING.dynamoDBReadPerUnit;
            const dynamoStorage = Math.max(0, params.storage - FREE_TIER.dynamoDBStorageGB) * PRICING.dynamoDBStoragePerGB;
            const dynamoTotal = dynamoWrites + dynamoReads + dynamoStorage;

            const dtCost = Math.max(0, params.transfer - FREE_TIER.dataTransferGB) * PRICING.dataTransferPerGB;

            return [
                { service: 'Lambda', cost: lambdaTotal },
                { service: 'API Gateway', cost: apigwRequests },
                { service: 'DynamoDB', cost: dynamoTotal },
                { service: 'Data Transfer', cost: dtCost },
            ];
        },
        freeTier: [
            { service: 'Lambda', text: '1M requests, 400,000 GB-seconds/month always free', status: 'covered' },
            { service: 'API Gateway', text: '1M REST API calls/month free (12 months)', status: 'covered' },
            { service: 'DynamoDB', text: '25 GB storage, 25 WCU/RCU always free', status: 'partial' },
            { service: 'Data Transfer', text: '100 GB/month free (aggregate)', status: 'partial' },
        ],
        tips: [
            { icon: '$', text: 'Use DynamoDB on-demand pricing for unpredictable workloads, or provisioned capacity with auto-scaling for steady traffic.', savings: 'Save 20-40%' },
            { icon: '*', text: 'Enable API Gateway caching for repeated requests. Even a 5-minute TTL dramatically reduces Lambda invocations.', savings: 'Save 30-70% on Lambda' },
            { icon: '>', text: 'Use Lambda Provisioned Concurrency only if you need sub-100ms cold starts. Otherwise, standard is cheaper.', savings: '' },
            { icon: '$', text: 'Consider HTTP APIs instead of REST APIs on API Gateway -- they are up to 71% cheaper.', savings: 'Save up to 71% on API Gateway' },
        ],
    },
    'traditional-web': {
        name: 'Traditional Web App',
        services: ['EC2', 'RDS', 'ALB', 'Data Transfer'],
        sliders: [
            { id: 'requests', label: 'Requests / Month', min: 10000, max: 50000000, default: 500000, step: 10000, format: 'number' },
            { id: 'storage', label: 'RDS Storage (GB)', min: 20, max: 1000, default: 50, step: 10, format: 'gb' },
            { id: 'transfer', label: 'Data Transfer Out (GB)', min: 1, max: 1000, default: 50, step: 1, format: 'gb' },
        ],
        selects: [
            { id: 'ec2Instance', label: 'EC2 Instance Type', options: Object.keys(PRICING.ec2) },
            { id: 'rdsInstance', label: 'RDS Instance Type', options: Object.keys(PRICING.rds) },
        ],
        defaults: { ec2Instance: 't3.small', rdsInstance: 'db.t3.micro' },
        calculate: function(params) {
            const ec2Type = params.ec2Instance || 't3.small';
            const rdsType = params.rdsInstance || 'db.t3.micro';
            const hoursInMonth = 730;

            // EC2: free tier only for t3.micro
            let ec2Hours = hoursInMonth;
            if (ec2Type === 't3.micro') {
                ec2Hours = Math.max(0, hoursInMonth - FREE_TIER.ec2Hours);
            }
            const ec2Cost = ec2Hours * PRICING.ec2[ec2Type];

            // RDS
            let rdsHours = hoursInMonth;
            if (rdsType === 'db.t3.micro') {
                rdsHours = Math.max(0, hoursInMonth - FREE_TIER.rdsHours);
            }
            const rdsCost = rdsHours * PRICING.rds[rdsType] + params.storage * PRICING.rdsStoragePerGB;

            // ALB
            const albCost = hoursInMonth * PRICING.albHourly + (params.requests / 1000000) * PRICING.albPerLCU * hoursInMonth * 0.1;

            const dtCost = Math.max(0, params.transfer - FREE_TIER.dataTransferGB) * PRICING.dataTransferPerGB;

            return [
                { service: 'EC2', cost: ec2Cost },
                { service: 'RDS', cost: rdsCost },
                { service: 'ALB', cost: albCost },
                { service: 'Data Transfer', cost: dtCost },
            ];
        },
        freeTier: [
            { service: 'EC2', text: '750 hours/month t3.micro (12 months)', status: 'partial' },
            { service: 'RDS', text: '750 hours/month db.t3.micro (12 months)', status: 'partial' },
            { service: 'ALB', text: 'No free tier for ALB', status: 'not-covered' },
            { service: 'Data Transfer', text: '100 GB/month free (aggregate)', status: 'partial' },
        ],
        tips: [
            { icon: '$', text: 'Use Reserved Instances for steady-state workloads. 1-year no-upfront RIs save ~30%, 3-year all-upfront saves ~60%.', savings: 'Save 30-60%' },
            { icon: '*', text: 'Use Spot Instances for stateless workers or batch processing at up to 90% discount.', savings: 'Save up to 90% on compute' },
            { icon: '>', text: 'Right-size your instances using AWS Compute Optimizer. Most instances are over-provisioned by 30-50%.', savings: 'Save 30-50%' },
            { icon: '$', text: 'Use RDS Multi-AZ only for production. Dev/staging can run Single-AZ to cut RDS costs in half.', savings: 'Save 50% on RDS (non-prod)' },
        ],
    },
    'containerized': {
        name: 'Containerized App',
        services: ['ECS Fargate', 'RDS', 'ALB', 'Data Transfer'],
        sliders: [
            { id: 'tasks', label: 'Number of Tasks', min: 1, max: 20, default: 2, step: 1, format: 'plain' },
            { id: 'cpuPerTask', label: 'vCPU per Task', min: 0.25, max: 4, default: 0.5, step: 0.25, format: 'vcpu' },
            { id: 'memPerTask', label: 'Memory per Task (GB)', min: 0.5, max: 16, default: 1, step: 0.5, format: 'gb' },
            { id: 'storage', label: 'RDS Storage (GB)', min: 20, max: 1000, default: 50, step: 10, format: 'gb' },
            { id: 'transfer', label: 'Data Transfer Out (GB)', min: 1, max: 1000, default: 50, step: 1, format: 'gb' },
        ],
        selects: [
            { id: 'rdsInstance', label: 'RDS Instance Type', options: Object.keys(PRICING.rds) },
        ],
        defaults: { rdsInstance: 'db.t3.small' },
        calculate: function(params) {
            const hoursInMonth = 730;
            const tasks = params.tasks || 2;
            const cpu = params.cpuPerTask || 0.5;
            const mem = params.memPerTask || 1;
            const rdsType = params.rdsInstance || 'db.t3.small';

            const fargateCost = tasks * hoursInMonth * (cpu * PRICING.ecsFargateCPUPerHour + mem * PRICING.ecsFargateMemPerGBHour);

            let rdsHours = hoursInMonth;
            if (rdsType === 'db.t3.micro') {
                rdsHours = Math.max(0, hoursInMonth - FREE_TIER.rdsHours);
            }
            const rdsCost = rdsHours * PRICING.rds[rdsType] + params.storage * PRICING.rdsStoragePerGB;

            const albCost = hoursInMonth * PRICING.albHourly;

            const dtCost = Math.max(0, params.transfer - FREE_TIER.dataTransferGB) * PRICING.dataTransferPerGB;

            return [
                { service: 'ECS Fargate', cost: fargateCost },
                { service: 'RDS', cost: rdsCost },
                { service: 'ALB', cost: albCost },
                { service: 'Data Transfer', cost: dtCost },
            ];
        },
        freeTier: [
            { service: 'ECS Fargate', text: 'No free tier for Fargate', status: 'not-covered' },
            { service: 'RDS', text: '750 hours/month db.t3.micro (12 months)', status: 'partial' },
            { service: 'ALB', text: 'No free tier for ALB', status: 'not-covered' },
            { service: 'Data Transfer', text: '100 GB/month free (aggregate)', status: 'partial' },
        ],
        tips: [
            { icon: '$', text: 'Use Fargate Spot for non-critical tasks at up to 70% discount. Great for async workers and batch jobs.', savings: 'Save up to 70%' },
            { icon: '*', text: 'Right-size your task definitions. Many tasks over-allocate CPU and memory. Use Container Insights to measure actual usage.', savings: 'Save 20-40%' },
            { icon: '>', text: 'Consider Graviton (ARM) instances for Fargate -- they offer ~20% better price-performance.', savings: 'Save ~20%' },
            { icon: '$', text: 'Use ECS Service Auto Scaling to reduce tasks during low-traffic periods.', savings: 'Save 30-50%' },
        ],
    },
    'ml-inference': {
        name: 'ML Inference',
        services: ['SageMaker', 'Data Transfer'],
        sliders: [
            { id: 'hours', label: 'Endpoint Hours / Month', min: 1, max: 730, default: 730, step: 1, format: 'hours' },
            { id: 'transfer', label: 'Data Transfer Out (GB)', min: 0.1, max: 500, default: 10, step: 0.1, format: 'gb' },
        ],
        selects: [
            { id: 'smInstance', label: 'SageMaker Instance Type', options: Object.keys(PRICING.sagemakerPerHour) },
        ],
        defaults: { smInstance: 'ml.m5.large' },
        calculate: function(params) {
            const instanceType = params.smInstance || 'ml.m5.large';
            const smCost = params.hours * PRICING.sagemakerPerHour[instanceType];
            const dtCost = Math.max(0, params.transfer - FREE_TIER.dataTransferGB) * PRICING.dataTransferPerGB;

            return [
                { service: 'SageMaker', cost: smCost },
                { service: 'Data Transfer', cost: dtCost },
            ];
        },
        freeTier: [
            { service: 'SageMaker', text: '250 hours/month of ml.t3.medium for first 2 months', status: 'partial' },
            { service: 'Data Transfer', text: '100 GB/month free (aggregate)', status: 'partial' },
        ],
        tips: [
            { icon: '$', text: 'Use SageMaker Serverless Inference for intermittent traffic. You pay only when the endpoint processes requests.', savings: 'Save 50-90% for bursty workloads' },
            { icon: '*', text: 'Use multi-model endpoints to host multiple models on one instance, sharing the compute cost.', savings: 'Save 50-80%' },
            { icon: '>', text: 'Consider SageMaker Savings Plans for steady-state inference -- commit to a spend level for up to 64% off.', savings: 'Save up to 64%' },
            { icon: '$', text: 'Use GPU instances (g4dn) only if your model requires it. CPU inference with ml.m5 is much cheaper for simpler models.', savings: '' },
        ],
    },
    'data-pipeline': {
        name: 'Data Pipeline',
        services: ['S3', 'Glue', 'Athena', 'Data Transfer'],
        sliders: [
            { id: 'storage', label: 'S3 Storage (GB)', min: 1, max: 10000, default: 100, step: 1, format: 'gb' },
            { id: 'glueDPUHours', label: 'Glue DPU-Hours / Month', min: 1, max: 1000, default: 50, step: 1, format: 'plain' },
            { id: 'athenaTB', label: 'Athena Data Scanned (TB/Month)', min: 0.01, max: 100, default: 1, step: 0.01, format: 'tb' },
            { id: 'transfer', label: 'Data Transfer Out (GB)', min: 0.1, max: 1000, default: 10, step: 0.1, format: 'gb' },
        ],
        calculate: function(params) {
            const s3Cost = Math.max(0, params.storage - FREE_TIER.s3StorageGB) * PRICING.s3StoragePerGB;
            const glueCost = params.glueDPUHours * PRICING.gluePerDPU;
            const athenaCost = params.athenaTB * PRICING.athenaPerTBScanned;
            const dtCost = Math.max(0, params.transfer - FREE_TIER.dataTransferGB) * PRICING.dataTransferPerGB;

            return [
                { service: 'S3', cost: s3Cost },
                { service: 'Glue', cost: glueCost },
                { service: 'Athena', cost: athenaCost },
                { service: 'Data Transfer', cost: dtCost },
            ];
        },
        freeTier: [
            { service: 'S3', text: '5 GB storage free (12 months)', status: 'partial' },
            { service: 'Glue', text: 'No free tier for Glue', status: 'not-covered' },
            { service: 'Athena', text: 'No free tier for Athena', status: 'not-covered' },
            { service: 'Data Transfer', text: '100 GB/month free (aggregate)', status: 'partial' },
        ],
        tips: [
            { icon: '$', text: 'Use columnar formats (Parquet, ORC) for S3 data. Athena scans less data, reducing query costs by 30-90%.', savings: 'Save 30-90% on Athena' },
            { icon: '*', text: 'Partition your S3 data by date or category. Athena can skip irrelevant partitions, scanning less data.', savings: 'Save 50-90% on Athena' },
            { icon: '>', text: 'Use S3 Lifecycle Policies to move older data to S3 Glacier or Intelligent-Tiering.', savings: 'Save 40-80% on storage' },
            { icon: '$', text: 'Optimize Glue jobs with job bookmarks and auto-scaling to avoid reprocessing data.', savings: 'Save 20-40% on Glue' },
        ],
    },
};

// ===== Chart Colors =====
const CHART_COLORS = ['#6c63ff', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#f472b6', '#22d3ee', '#fb923c'];

// ===== State =====
let currentArch = 'static-website';
let isAnnual = false;
let params = {};

// ===== DOM References =====
const archGrid = document.getElementById('architecture-grid');
const slidersContainer = document.getElementById('sliders-container');
const barChart = document.getElementById('bar-chart');
const breakdownTable = document.getElementById('breakdown-table');
const totalAmount = document.getElementById('total-amount');
const totalLabel = document.getElementById('total-label');
const freeTierNote = document.getElementById('free-tier-note');
const freeTierDetails = document.getElementById('free-tier-details');
const tipsContainer = document.getElementById('tips-container');
const billingToggle = document.getElementById('billing-toggle');
const monthlyLabel = document.getElementById('monthly-label');
const annualLabel = document.getElementById('annual-label');

// ===== Formatting Helpers =====
function formatNumber(n) {
    if (n >= 1000000000) {
        return (n / 1000000000).toFixed(1) + 'B';
    }
    if (n >= 1000000) {
        return (n / 1000000).toFixed(1) + 'M';
    }
    if (n >= 1000) {
        return (n / 1000).toFixed(1) + 'K';
    }
    return n.toLocaleString();
}

function formatSliderValue(value, format) {
    switch (format) {
        case 'number': return formatNumber(value);
        case 'gb': return value + ' GB';
        case 'tb': return value + ' TB';
        case 'hours': return value + ' hrs';
        case 'vcpu': return value + ' vCPU';
        case 'plain': return value.toString();
        default: return value.toString();
    }
}

function formatCurrency(amount) {
    if (amount < 0.01 && amount > 0) {
        return '< $0.01';
    }
    return '$' + amount.toFixed(2);
}

// ===== Architecture Selection =====
archGrid.addEventListener('click', function(e) {
    const card = e.target.closest('.arch-card');
    if (!card) {
        return;
    }
    const arch = card.dataset.arch;
    if (arch === currentArch) {
        return;
    }
    document.querySelectorAll('.arch-card').forEach(function(c) {
        c.classList.remove('selected');
    });
    card.classList.add('selected');
    currentArch = arch;
    buildUI();
});

// ===== Billing Toggle =====
billingToggle.addEventListener('click', function() {
    isAnnual = !isAnnual;
    billingToggle.classList.toggle('active', isAnnual);
    monthlyLabel.classList.toggle('active', !isAnnual);
    annualLabel.classList.toggle('active', isAnnual);
    recalculate();
});

// ===== Build UI =====
function buildUI() {
    const arch = ARCHITECTURES[currentArch];
    params = {};
    slidersContainer.innerHTML = '';

    // Build selects
    if (arch.selects) {
        arch.selects.forEach(function(sel) {
            params[sel.id] = arch.defaults[sel.id] || sel.options[0];
            var group = document.createElement('div');
            group.className = 'select-group';
            var label = document.createElement('label');
            label.setAttribute('for', 'select-' + sel.id);
            label.textContent = sel.label;
            var select = document.createElement('select');
            select.id = 'select-' + sel.id;
            sel.options.forEach(function(opt) {
                var option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                if (opt === params[sel.id]) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
            select.addEventListener('change', function() {
                params[sel.id] = this.value;
                recalculate();
            });
            group.appendChild(label);
            group.appendChild(select);
            slidersContainer.appendChild(group);
        });
    }

    // Build sliders
    arch.sliders.forEach(function(slider) {
        params[slider.id] = slider.default;
        var group = document.createElement('div');
        group.className = 'slider-group';

        var header = document.createElement('div');
        header.className = 'slider-header';
        var labelSpan = document.createElement('span');
        labelSpan.className = 'slider-label';
        labelSpan.textContent = slider.label;
        var valueSpan = document.createElement('span');
        valueSpan.className = 'slider-value';
        valueSpan.id = 'value-' + slider.id;
        valueSpan.textContent = formatSliderValue(slider.default, slider.format);
        header.appendChild(labelSpan);
        header.appendChild(valueSpan);

        var input = document.createElement('input');
        input.type = 'range';
        input.id = 'slider-' + slider.id;
        input.min = slider.min;
        input.max = slider.max;
        input.value = slider.default;
        input.step = slider.step;
        input.addEventListener('input', function() {
            var val = parseFloat(this.value);
            params[slider.id] = val;
            valueSpan.textContent = formatSliderValue(val, slider.format);
            recalculate();
        });

        var rangeLabels = document.createElement('div');
        rangeLabels.className = 'slider-range-labels';
        var minLabel = document.createElement('span');
        minLabel.textContent = formatSliderValue(slider.min, slider.format);
        var maxLabel = document.createElement('span');
        maxLabel.textContent = formatSliderValue(slider.max, slider.format);
        rangeLabels.appendChild(minLabel);
        rangeLabels.appendChild(maxLabel);

        group.appendChild(header);
        group.appendChild(input);
        group.appendChild(rangeLabels);
        slidersContainer.appendChild(group);
    });

    // Build free tier details
    freeTierDetails.innerHTML = '';
    arch.freeTier.forEach(function(item) {
        var div = document.createElement('div');
        div.className = 'free-tier-item';
        var badge = document.createElement('span');
        badge.className = 'free-tier-badge ' + item.status;
        if (item.status === 'covered') {
            badge.textContent = 'FREE';
        } else if (item.status === 'partial') {
            badge.textContent = 'PARTIAL';
        } else {
            badge.textContent = 'PAID';
        }
        var text = document.createElement('span');
        text.textContent = item.service + ' -- ' + item.text;
        div.appendChild(badge);
        div.appendChild(text);
        freeTierDetails.appendChild(div);
    });

    // Build tips
    tipsContainer.innerHTML = '';
    arch.tips.forEach(function(tip) {
        var div = document.createElement('div');
        div.className = 'tip-item';
        var icon = document.createElement('span');
        icon.className = 'tip-icon';
        if (tip.icon === '$') {
            icon.textContent = '$';
        } else if (tip.icon === '*') {
            icon.textContent = '*';
        } else {
            icon.textContent = '>';
        }
        var textDiv = document.createElement('div');
        textDiv.className = 'tip-text';
        var mainText = tip.text;
        if (tip.savings) {
            mainText += ' ';
            var savingsSpan = document.createElement('span');
            savingsSpan.className = 'tip-savings';
            savingsSpan.textContent = tip.savings;
            textDiv.textContent = mainText;
            textDiv.appendChild(savingsSpan);
        } else {
            textDiv.textContent = mainText;
        }
        div.appendChild(icon);
        div.appendChild(textDiv);
        tipsContainer.appendChild(div);
    });

    recalculate();
}

// ===== Recalculate =====
function recalculate() {
    var arch = ARCHITECTURES[currentArch];
    var breakdown = arch.calculate(params);
    var multiplier = isAnnual ? 12 : 1;

    var total = 0;
    breakdown.forEach(function(item) {
        total += item.cost;
    });

    var displayTotal = total * multiplier;
    totalAmount.textContent = formatCurrency(displayTotal);
    totalLabel.textContent = isAnnual ? 'Estimated Annual Cost' : 'Estimated Monthly Cost';

    // Free tier note
    if (total < 1) {
        freeTierNote.textContent = 'This usage level may be mostly covered by the AWS Free Tier!';
    } else if (total < 10) {
        freeTierNote.textContent = 'Some services are partially covered by the AWS Free Tier.';
    } else {
        freeTierNote.textContent = '';
    }

    // Bar chart
    var maxCost = 0;
    breakdown.forEach(function(item) {
        if (item.cost * multiplier > maxCost) {
            maxCost = item.cost * multiplier;
        }
    });

    barChart.innerHTML = '';
    breakdown.forEach(function(item, i) {
        var wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';

        var amount = document.createElement('div');
        amount.className = 'bar-amount';
        amount.textContent = formatCurrency(item.cost * multiplier);

        var bar = document.createElement('div');
        bar.className = 'bar';
        var height = maxCost > 0 ? (item.cost * multiplier / maxCost) * 160 : 2;
        if (height < 2) {
            height = 2;
        }
        bar.style.height = height + 'px';
        bar.style.backgroundColor = CHART_COLORS[i % CHART_COLORS.length];

        var label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = item.service;

        wrapper.appendChild(amount);
        wrapper.appendChild(bar);
        wrapper.appendChild(label);
        barChart.appendChild(wrapper);
    });

    // Breakdown table
    breakdownTable.innerHTML = '';
    breakdown.forEach(function(item, i) {
        var row = document.createElement('div');
        row.className = 'breakdown-row';

        var serviceDiv = document.createElement('div');
        serviceDiv.className = 'breakdown-service';
        var dot = document.createElement('span');
        dot.className = 'breakdown-dot';
        dot.style.backgroundColor = CHART_COLORS[i % CHART_COLORS.length];
        var name = document.createElement('span');
        name.textContent = item.service;
        serviceDiv.appendChild(dot);
        serviceDiv.appendChild(name);

        var costDiv = document.createElement('div');
        costDiv.className = 'breakdown-cost';
        costDiv.textContent = formatCurrency(item.cost * multiplier);

        row.appendChild(serviceDiv);
        row.appendChild(costDiv);
        breakdownTable.appendChild(row);
    });

    // Total row
    var totalRow = document.createElement('div');
    totalRow.className = 'breakdown-row total-row';
    var totalService = document.createElement('div');
    totalService.className = 'breakdown-service';
    totalService.textContent = 'Total';
    var totalCost = document.createElement('div');
    totalCost.className = 'breakdown-cost';
    totalCost.textContent = formatCurrency(displayTotal);
    totalRow.appendChild(totalService);
    totalRow.appendChild(totalCost);
    breakdownTable.appendChild(totalRow);
}

// ===== Initialize =====
buildUI();
