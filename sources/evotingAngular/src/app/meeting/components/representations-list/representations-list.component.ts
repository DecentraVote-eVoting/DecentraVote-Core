/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MemberRepresentation} from '@meeting/models/meeting-member.model';
import {User} from '@app/user/models/user.model';

@Component({
  selector: 'app-representations-list',
  templateUrl: './representations-list.component.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class RepresentationsListComponent {

  @Input() changesAllowed: boolean;
  @Input() representations: MemberRepresentation[];

  @Output() selectAction = new EventEmitter<User>();
  @Output() iconClickedAction = new EventEmitter<User>();

  selectedMember: User;

  constructor() {
  }

  onSelect(member: User) {
    this.selectedMember = member;
    this.selectAction.emit(member);
  }

  onDeleteClick(representee: User) {
    this.selectedMember = representee;
    this.iconClickedAction.emit(representee);
  }

}
