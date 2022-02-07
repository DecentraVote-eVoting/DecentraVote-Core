/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {ROUTE_PATHS} from '@app/route-paths';

@Component({
  selector: 'app-login-response-page',
  template: `<!-- Empty Component -->`
})
export class LoginResponsePageComponent implements OnInit, OnDestroy {
  private givenName: string;
  private familyName: string;

  private unsubscribe$ = new Subject();

  constructor(private router: Router,
              private route: ActivatedRoute) {
    this.route.queryParams
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(params => {
        this.givenName = params['givenName'] || null;
        this.familyName = params['familyName'] || null;
      });
  }

  ngOnInit() {
    this.router.navigate([ROUTE_PATHS.REGISTER_ETH_ADDRESS.valueOf()], {
      queryParams: {
        givenName: this.givenName,
        familyName: this.familyName
      }
    }).catch(_ => console.warn('Could not navigate to route'));
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}

