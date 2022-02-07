/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {SpinnerInfo} from '../../models/spinner.model';
import {SpinnerService} from '../../services/spinner.service';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html'
})
export class SpinnerComponent implements OnDestroy {

  spinner: SpinnerInfo[] = [];

  private unsubscribe$ = new Subject();

  constructor(private spinnerService: SpinnerService) {
  }

  ngOnInit() {
    this.spinnerService.getSpinner()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(spinner => {
        this.spinner = spinner.slice().reverse();
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
