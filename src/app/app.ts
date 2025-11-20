import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridModule } from 'ag-grid-angular';
import { ChartModule, Chart } from 'angular-highcharts';
import { AllCommunityModule, ColDef, ModuleRegistry } from 'ag-grid-community';
import * as Highcharts from 'highcharts';
import { WeatherService, WeatherForecast } from './weather';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridModule, ChartModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  weatherData = signal<WeatherForecast[]>([]);
  startDate = signal<string>('');
  loading = signal<boolean>(false);
  error = signal<string>('');

  tempChart?: Chart;
  humidityChart?: Chart;

  colDefs: ColDef[] = [
    { field: 'date', headerName: 'Date', sortable: true, filter: true },
    { field: 'temperatureRange.low', headerName: 'Temp Low (°C)', sortable: true, filter: true },
    { field: 'temperatureRange.high', headerName: 'Temp High (°C)', sortable: true, filter: true },
    { field: 'temperature', headerName: 'Avg Temp (°C)', sortable: true, filter: true },
    { field: 'humidity', headerName: 'Humidity (%)', sortable: true, filter: true }
  ];

  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true
  };

  constructor(private weatherService: WeatherService) {
    this.startDate.set(this.weatherService.getDefaultStartDate());
  }

  ngOnInit() {
    this.fetchWeatherData();
  }

  fetchWeatherData() {
    this.loading.set(true);
    this.error.set('');

    this.weatherService.getWeatherForecastFor30Days(this.startDate()).subscribe({
      next: (data) => {
        this.weatherData.set(data);
        this.loading.set(false);
        this.updateCharts();
      },
      error: () => {
        this.error.set('Failed to fetch weather data. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private updateCharts() {
    const data = this.weatherData();
    if (data.length === 0) return;

    const dates = data.map(item => item.date);
    const temperatures = data.map(item => item.temperature);
    const humidity = data.map(item => item.humidity);
    const tempLows = data.map(item => item.temperatureRange.low);
    const tempHighs = data.map(item => item.temperatureRange.high);

    const tempChartOptions: Highcharts.Options = {
      title: { text: 'Temperature Trend (30 Days)' },
      xAxis: {
        title: { text: 'Date' },
        categories: dates
      },
      yAxis: { title: { text: 'Temperature (°C)' } },
      series: [
        {
          type: 'line',
          name: 'Max Temp',
          data: tempHighs,
          color: '#ff6384'
        },
        {
          type: 'line',
          name: 'Min Temp',
          data: tempLows,
          color: '#36a2eb'
        },
        {
          type: 'line',
          name: 'Avg Temp',
          data: temperatures,
          color: '#ffce56',
          marker: { enabled: true }
        }
      ]
    };

    const humidityChartOptions: Highcharts.Options = {
      title: { text: 'Humidity Trend (30 Days)' },
      xAxis: {
        title: { text: 'Date' },
        categories: dates
      },
      yAxis: { title: { text: 'Humidity (%)' } },
      series: [
        {
          type: 'line',
          name: 'Humidity (%)',
          data: humidity,
          color: '#37808d',
          marker: { enabled: true }
        }
      ]
    };

    this.tempChart = new Chart(tempChartOptions);
    this.humidityChart = new Chart(humidityChartOptions);
  }

  onDateChange(event: any) {
    this.startDate.set(event.target.value);
  }

  refreshData() {
    this.fetchWeatherData();
  }
}
