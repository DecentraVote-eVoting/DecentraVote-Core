/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';

import {ToasterInfo, ToasterType} from 'src/app/core/models/toaster.model';
import {ToasterService} from 'src/app/core/services/toaster.service';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-toaster',
  templateUrl: './toaster.component.html'
})
export class ToasterComponent implements OnInit, OnDestroy {
  toasterInfos: ToasterInfo[] = [];
  toasterTypes = ToasterType;

  private unsubscribe$ = new Subject();

  constructor(private toasterService: ToasterService) {
  }

  ngOnInit() {
    this.toasterService.getToasts()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(toasts => {
        this.toasterInfos = toasts.slice().reverse();
      });
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  removeToaster(toaster: ToasterInfo) {
    this.toasterService.removeToaster(toaster);
  }

}
