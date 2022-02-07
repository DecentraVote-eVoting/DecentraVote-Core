/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {AbstractModalComponent} from "@core/components/abstract-modal/abstract-modal.component";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {PlatformLocation} from "@angular/common";

@Component({
  selector: 'app-export-users-modal',
  templateUrl: './export-users-modal.component.html'
})
export class ExportUsersModalComponent extends AbstractModalComponent implements OnInit {

  @Input()
  disableExportJSON: boolean;
  @Input()
  disableExportCSV: boolean;

  @Output()
  exportJSONClick = new EventEmitter();
  @Output()
  exportCSVClick = new EventEmitter();

  constructor(protected modalRef: NgbActiveModal,
              private platform: PlatformLocation) {
    super(modalRef, platform);
  }

  ngOnInit() {
  }

  onExportJSONClick() {
    this.exportJSONClick.emit();
  }

  onExportCSVClick() {
    this.exportCSVClick.emit();
  }

}
