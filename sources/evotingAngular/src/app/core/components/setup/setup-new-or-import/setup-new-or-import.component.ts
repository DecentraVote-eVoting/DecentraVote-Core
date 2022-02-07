/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-setup-new-or-import',
  templateUrl: './setup-new-or-import.component.html'
})
export class SetupNewOrImportComponent {

  @Output() createNewAction = new EventEmitter<boolean>();

  constructor() {
  }

}
