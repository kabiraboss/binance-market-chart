import React, { useEffect, useState, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import { Line } from 'react-chartjs-2';

import 'chartjs-adapter-date-fns'; 

Chart.register(...registerables);

const symbols = {
    ETH: 'ethusdt',
    BNB: 'bnbusdt',
    DOT: 'dotusdt',
};

const timeframes = {
    '5m': '5 minute',
    '15m': '15 minute',
    '25m': '25 minute',
};

function App() {
    const [selectedSymbol, setSelectedSymbol] = useState(symbols.ETH);
    const [selectedInterval, setSelectedInterval] = useState('1m');
    const [historicalData, setHistoricalData] = useState({});
    const [chartData, setChartData] = useState([]);

    const updateChartData = useCallback((symbol, newData) => {
        setHistoricalData((prevHistoricalData) => {
            const currentData = prevHistoricalData[symbol] || [];
            const updatedData = [...currentData, newData];

            localStorage.setItem('historicalData', JSON.stringify({
                ...prevHistoricalData,
                [symbol]: updatedData,
            }));

            return {
                ...prevHistoricalData,
                [symbol]: updatedData,
            };
        });

        setChartData((prevChartData) => [...prevChartData, newData]);
    }, []);

    useEffect(() => {
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol}@kline_${selectedInterval}`);

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const candlestick = message.k;
            if (candlestick.x) { 
                const newChartData = {
                    time: candlestick.t,
                    open: parseFloat(candlestick.o),
                    high: parseFloat(candlestick.h),
                    low: parseFloat(candlestick.l),
                    close: parseFloat(candlestick.c),
                };
                updateChartData(selectedSymbol, newChartData);
            }
        };

        return () => {
            ws.close();
        };
    }, [selectedSymbol, selectedInterval, updateChartData]);

    const handleSymbolChange = (e) => {
        const newSymbol = e.target.value;
        setSelectedSymbol(newSymbol);
        const storedData = JSON.parse(localStorage.getItem('historicalData'));
        setChartData(storedData[newSymbol] || []);
    };

    const handleIntervalChange = (e) => {
        setSelectedInterval(e.target.value);
    };

    const chartDataset = {
        labels: chartData.map(data => new Date(data.time)),
        datasets: [{
            label: 'Close Price',
            data: chartData.map(data => data.close),
            borderColor: '#007bff',
            fill: false,
        }],
    };

    const chartOptions = {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'minute',
                },
                title: {
                    display: true,
                    text: 'Time',
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Price (USDT)',
                },
            },
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
        },
    };

    return (
        <div>
          <div className='rohit'>
            <h1>Binance Market Data</h1>
            <select onChange={handleSymbolChange} value={selectedSymbol}>
                {Object.keys(symbols).map(symbol => (
                    <option key={symbol} value={symbols[symbol]}>{symbol}/USDT</option>
                ))}
            </select>
            <select onChange={handleIntervalChange} value={selectedInterval}>
                {Object.keys(timeframes).map(interval => (
                    <option key={interval} value={interval}>{timeframes[interval]}</option>
                ))}
            </select>
            <Line data={chartDataset} options={chartOptions} />
            </div>
        </div>
    );
}

export default App;
