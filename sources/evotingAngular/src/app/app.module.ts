/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {AppComponent} from './app.component';
import {StoreModule} from '@ngrx/store';
import {reducers} from './app.store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {AppRoutingModule} from './app-routing.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material/button';
import {ActivatedRouteSnapshot} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {EmptyComponent} from '@app/empty.component';
import {CoreModule} from '@core/core.module';
import {EffectsModule} from '@ngrx/effects';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {StorageService} from '@core/services/storage.service';
import {StorageTranslationLoader} from '@core/utils/storage-translation-loader';
import {CookieService} from 'ngx-cookie-service';
import {AuthenticationProvider} from '@core/services/authentication-interceptor.service';
import {MeetingEffects} from '@meeting/+state/meeting.effects.service';
import {SortablejsModule} from 'ngx-sortablejs';
import {VotingModule} from '@voting/voting.module';
import {NgCircleProgressModule} from 'ng-circle-progress';

export const COMPONENTS = [
  AppComponent,
  EmptyComponent
];

export function StorageLoaderFactory(storageService: StorageService) {
  return new StorageTranslationLoader(storageService);
}

@NgModule({
  declarations: [COMPONENTS],
  imports: [
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    BrowserModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    EffectsModule.forRoot([MeetingEffects]),
    [StoreModule.forRoot(reducers)],
    StoreDevtoolsModule.instrument({
      name: 'EVoting',
      maxAge: 25,
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: StorageLoaderFactory,
        deps: [StorageService]
      }
    }),
    NgCircleProgressModule.forRoot({
      radius: 16,
      percent: 0,
      animation: true
    }),
    CoreModule,
    VotingModule,
    SortablejsModule.forRoot({})
  ],
  providers: [
    AuthenticationProvider,
    {
      provide: 'externalUrlRedirectResolver',
      useValue: (route: ActivatedRouteSnapshot) => {
        window.location.href = (route.data as any).externalUrl;
      },
    },
    CookieService
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
}
