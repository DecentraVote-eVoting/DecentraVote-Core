/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-setup-get-started',
  templateUrl: './setup-get-started.component.html'
})
export class SetupGetStartedComponent {

  @Output() getStartedAction = new EventEmitter<void>();

  constructor() {
  }

}
