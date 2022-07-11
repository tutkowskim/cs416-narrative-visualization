const dataPromise = d3.json('/winemag-data-130k-v2.json');

const average = (set) => Array.from(set).reduce((a, b) => (a + b), 0) / set.length;

const fetchAppContainer = () => d3.select('.app');
const fetchNarrativeContainer = () => d3.select('.app-narrative');
const fetchTooltipContainer = () => d3.select('.app-narrative-tooltip');

const getScatterPlotXS = (svgElement, minX, maxX) => {
    const svgWidth = svgElement.node().getBoundingClientRect().width;
    return d3.scaleLinear().domain([minX,maxX]).range([0,svgWidth-100]);
}

const getScatterPlotYS = (svgElement, minY,maxY) => {
    const svgHeight = svgElement.node().getBoundingClientRect().height;
    return d3.scaleLinear().domain([minY,maxY]).range([0, svgHeight-100]);
}

const transformScatterPlotData = (data, groupBy, buildExtraToolTipDataFn) => {
    const groupedScores = {};
    data.forEach(item => {
        points = Number(item.points);
        price = Number(item.price);

        if (groupedScores[item[groupBy]]) {
            groupedScores[item[groupBy]].points.push(points);
            groupedScores[item[groupBy]].prices.push(price);
        } else {
            groupedScores[item[groupBy]] = { 
                key: item[groupBy],
                points: [points],
                prices: [price],
                tooltipData: buildExtraToolTipDataFn(item),
            };
        }
    });
    const scatterPlotData = Object.values(groupedScores);
    scatterPlotData.forEach((value) => value.averagePoints = Number(average(value.points)).toFixed(2));
    scatterPlotData.forEach((value) => value.averagePrice = Number(average(value.prices)).toFixed(2));
    scatterPlotData.forEach((value) => value.tooltipData['Average Points'] = `${value.averagePoints}`);
    scatterPlotData.forEach((value) => value.tooltipData['Average Price'] = `$${value.averagePrice}`);
    return scatterPlotData;
}

const drawScatterPlot = (svgElement, title, scatterPlotData, minX, minY, maxX, maxY) => {
    const svgWidth = svgElement.node().getBoundingClientRect().width;
    const svgHeight = svgElement.node().getBoundingClientRect().height;
    const xs = getScatterPlotXS(svgElement, minX, maxX);
    const ys = getScatterPlotYS(svgElement, minY, maxY);

    svgElement
        .append('g')
        .attr('transform', 'translate(50,50)')
        .selectAll()
        .data(scatterPlotData)
        .enter()
        .append('circle')
        .attr('fill', '#0020b0')
        .attr('r', 3)
        .attr('cx', (d,i) => xs(d.averagePrice))
        .attr('cy', (d,i) => svgHeight - 100 - ys(d.averagePoints))
        .on('mouseover', (event) => {
            const element = d3.select(event.srcElement);
            element.style('outline', '3px solid black');
            data = element.datum();
        
            const tooltip = fetchTooltipContainer();
            tooltip.html(Object.entries(data.tooltipData).map(([key, value]) => `<b>${key}</b>: ${value}`).join('<br>'));
            tooltip.style('top', `${event.clientY + 10}px`);
            tooltip.style('left', `${event.clientX + 10}px`);
            tooltip.style('display', 'inline');
        })
        .on('mouseleave', (event) => {
            const tooltip = fetchTooltipContainer();
            tooltip.style('display', 'none');
            tooltip.selectAll('*').remove();
        
            const element = d3.select(event.srcElement);
            element.style('outline', undefined);
        });

   svgElement
        .append('g')
        .attr('transform', 'translate(50,50)')
        .call(d3.axisLeft(d3.scaleLinear().domain([minY,maxY]).range([svgHeight-100, 0])));
      
    svgElement
        .append('g')
        .attr('transform', `translate(50,${svgHeight-50})`)
        .call(d3.axisBottom(d3.scaleLinear().domain([minX, maxX]).range([0,svgWidth-100])));

    svgElement.append('text')
        .attr('x', '50%')
        .attr('y',  14)
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle')
        .attr('style', 'font-size: 1.17em')
        .text(title);
    
    svgElement.append('text')
        .attr('x', '50%')
        .attr('y', svgHeight - 10)
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle')
        .text('Average Price (dollars)');
        
    
    svgElement.append('g')
        .attr('transform', `translate(12, ${svgHeight / 2})`)
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .text('Average Score (0-100)');
}

const drawInitialScene = async () => {
    const container = fetchNarrativeContainer().append('div').attr('style', 'display: flex; align-items: center; justify-content: center; height: 100%;')
    const wrapper = container.append('div');
    wrapper.append('h3').html('Is it really worth splurging on that bottle of wine?')
    wrapper.append('img').attr('src', '/wine.svg').attr('height', 150);
}

const drawCountryScene = async () => {
    const data = await dataPromise;
    const scatterPlotData = transformScatterPlotData(
        data.filter(item => !!item.price && Number(item.price) > 0 && !!item.points && Number(item.points)),
        'country',
        (item) => ({ 'Country':  item.country }),
    );
    
    const svgElement = fetchNarrativeContainer().append('svg');
    svgElement.attr('width', '100%').attr('height', '100%');

    const minX = 1;
    const maxX = Math.max(...scatterPlotData.map(item => item.averagePrice));
    const minY = 78;
    const maxY = 100;
    drawScatterPlot(svgElement, 'Wine Scores grouped by Countries', scatterPlotData, minX, minY, maxX, maxY);
}

const drawProvidencesScene = async () => {
    const data = await dataPromise;
    const scatterPlotData = transformScatterPlotData(
        data.filter(item => !!item.price && Number(item.price) > 0 && !!item.points && Number(item.points)),
        'province',
        (item) => ({ 'Country':  item.country, 'Province': item['province'] }),
    );

    const svgElement = fetchNarrativeContainer().append('svg');
    svgElement.attr('width', '100%').attr('height', '100%');

    const minX = 1;
    const maxX = Math.max(...scatterPlotData.map(item => item.averagePrice));
    const minY = 78;
    const maxY = 100;
    drawScatterPlot(svgElement, 'Wine Scores grouped by Province', scatterPlotData, minX, minY, maxX, maxY);
}

const drawRegionsScene = async () => {
    const data = await dataPromise;
    const scatterPlotData = transformScatterPlotData(
        data.filter(item => !!item.price && Number(item.price) > 0 && !!item.points && Number(item.points)),
        'region_1',
        (item) => ({ 'Country':  item.country, 'Province': item['province'], 'Region': item['region_1'] }),
    );

    const svgElement = fetchNarrativeContainer().append('svg');
    svgElement.attr('width', '100%').attr('height', '100%');

    const minX = 1;
    const maxX = Math.max(...scatterPlotData.map(item => item.averagePrice));
    const minY = 78;
    const maxY = 100;
    drawScatterPlot(svgElement, 'Wine Scores grouped by Regions', scatterPlotData, minX, minY, maxX, maxY);
}

const drawRegionsUnder200Scene = async () => {
    const data = await dataPromise;
    const scatterPlotData = transformScatterPlotData(
        data.filter(item => !!item.price && Number(item.price) > 0 && Number(item.price) <= 200 && !!item.points && Number(item.points)),
        'region_1',
        (item) => ({ 'Country':  item.country, 'Province': item['province'], 'Region': item['region_1'] }),
    );

    const svgElement = fetchNarrativeContainer().append('svg');
    svgElement.attr('width', '100%').attr('height', '100%');

    const minX = 1;
    const maxX = Math.max(...scatterPlotData.map(item => item.averagePrice));
    const minY = 78;
    const maxY = 100;
    drawScatterPlot(svgElement, 'Wine Scores grouped by Regions < $200', scatterPlotData, minX, minY, maxX, maxY);
}

const drawWineriesUnder200Scene = async () => {
    const data = await dataPromise;
    const scatterPlotData = transformScatterPlotData(
        data.filter(item => !!item.price && Number(item.price) > 0 && Number(item.price) <= 200 && !!item.points && Number(item.points)),
        'winery',
        (item) => ({ 'Country':  item.country, 'Province': item['province'], 'Region': item['region_1'], 'Winery': item['winery'] }),
    );

    const svgElement = fetchNarrativeContainer().append('svg');
    svgElement.attr('width', '100%').attr('height', '100%');

    const minX = 1;
    const maxX = Math.max(...scatterPlotData.map(item => item.averagePrice));
    const minY = 78;
    const maxY = 100;
    drawScatterPlot(svgElement, 'Wine Scores grouped by Wineries < $200', scatterPlotData, minX, minY, maxX, maxY);

    const xs = getScatterPlotXS(svgElement, minX, maxX);
    const ys = getScatterPlotYS(svgElement, minY, maxY);
    svgElement
        .append('g')
        .attr('class', 'annotation-group')
        .call(d3.annotation()
            .notePadding(15)
            .type(d3.annotationCalloutCircle)
            .annotations([{
                note: { label: "Sweet Spot" },
                x: xs(100-35),
                y: ys(90),
                ny: 150,
                nx: 150,
                subject: { radius: 90 },
            }])
        );
}

const narrativeSteps = [
    drawInitialScene,
    drawCountryScene,
    drawProvidencesScene,
    drawRegionsScene,
    drawRegionsUnder200Scene,
    drawWineriesUnder200Scene,
];

let currentStep = 0;

const applyStep = async (stepNumber) => {
    const appHeight = d3.select('body').node().getBoundingClientRect().height;
    fetchAppContainer().style('height', `${appHeight}px`);
    if (stepNumber >= 0 && stepNumber < narrativeSteps.length && narrativeSteps[stepNumber] instanceof Function) {
        fetchNarrativeContainer().selectAll('*').remove();
        await narrativeSteps[stepNumber]();
        currentStep = stepNumber;
        d3.select('.button-previous').attr('disabled', currentStep <= 0 ? true : undefined);
        d3.select('.button-next').attr('disabled', currentStep >= narrativeSteps.length - 1 ? true : undefined);
    }
}

const init = async () => {
    await applyStep(0);
}

const handleResize = async () => {
    await applyStep(currentStep);
}