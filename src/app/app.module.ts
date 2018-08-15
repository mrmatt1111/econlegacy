import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ImageService } from './services/image.service';
import { AppComponent } from './app.component';
import { PlanetComponent } from './planet';

// export { MapTile } from './planet/map-tile';

@NgModule({
  declarations: [
    AppComponent, PlanetComponent
  ],
  imports: [
    BrowserModule, HttpClientModule
  ],
  providers: [ImageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
