import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

export interface WeatherForecast {
  date: string;
  temperature: number;
  humidity: number;
  temperatureRange: {
    low: number;
    high: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly apiUrl = 'https://api.data.gov.sg/v1/environment/4-day-weather-forecast';

  constructor(private http: HttpClient) {}

  getWeatherForecastFor30Days(startDate: string): Observable<WeatherForecast[]> {
    const dateRequests: Observable<WeatherForecast>[] = [];
    
    // Create requests for 30 days starting from the given date
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateString = currentDate.toISOString().split('T')[0];
      
      dateRequests.push(this.getWeatherForecastForDate(dateString));
    }

    return forkJoin(dateRequests);
  }

  private getWeatherForecastForDate(date: string): Observable<WeatherForecast> {
    return this.http.get<any>(`${this.apiUrl}?date=${date}`).pipe(
      map(response => {
        if (response.items?.[0]?.forecasts?.[0]) {
          const forecast = response.items[0].forecasts[0];
          const avgTemp = (forecast.temperature.low + forecast.temperature.high) / 2;
          const avgHumidity = (forecast.relative_humidity.low + forecast.relative_humidity.high) / 2;
          
          return {
            date: forecast.date,
            temperature: Math.round(avgTemp * 10) / 10,
            humidity: Math.round(avgHumidity),
            temperatureRange: {
              low: forecast.temperature.low,
              high: forecast.temperature.high
            }
          };
        }
        throw new Error('Invalid forecast data for date: ' + date);
      })
    );
  }

  
  getDefaultStartDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }
}
