/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {User} from '@app/user/models/user.model';
import {takeUntil} from 'rxjs/operators';
import {UserFacade} from '@app/user/services/user.facade';
import {Subject} from 'rxjs';
import {MemberNamePipe} from '@core/pipes/member-name.pipe';

@Component({
  selector: 'app-create-meeting-modal-list',
  templateUrl: './create-meeting-modal-list.component.html',
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class CreateMeetingModalListComponent implements OnInit, OnDestroy {

  @Input() selectedMember: User;
  @Input() showEmail = true;

  @Output() selectAction = new EventEmitter<User>();

  allUsers: User[] = [];
  filteredUsers: User[] = [];
  searchText = '';

  private unsubscribe$ = new Subject();

  constructor(private cdr: ChangeDetectorRef,
              private userFacade: UserFacade,
              private memberNamePipe: MemberNamePipe) {
  }

  ngOnInit() {
    this.userFacade.getValidUsers()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(users => {
        this.allUsers = users;
        this.filteredUsers = users;
        this.search(this.searchText);
        this.cdr.detectChanges();
      });
  }

  search(searchText: string) {
    this.searchText = searchText;
    if (!this.searchText) {
      this.filteredUsers = this.allUsers;
    } else {
      this.filteredUsers = (this.allUsers || [])
        .filter(user => this.memberNamePipe
          .transform(user)
          .toLowerCase()
          .includes(this.searchText.toLowerCase())
        );
    }
  }

  onSelect(member: User) {
    this.selectedMember = member;
    this.selectAction.emit(this.selectedMember);
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
