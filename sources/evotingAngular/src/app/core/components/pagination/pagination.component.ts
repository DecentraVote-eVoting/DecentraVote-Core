/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'pagination',
  templateUrl: './pagination.component.html'
})
export class paginationComponent {
  @Input()
  listlength: number
  @Input()
  page: number
  @Input()
  pageSize: number

  @Output()
  pageChange = new EventEmitter<number>()

}
