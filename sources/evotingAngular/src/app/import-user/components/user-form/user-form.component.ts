/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import {ImportUser, ImportUserRaw} from '@import-user/models/import-user.model';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {Role} from '@user/models/role.model';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PlatformLocation} from '@angular/common';
import {first, takeUntil} from 'rxjs/operators';
import {UserFacade} from "@user/services/user.facade";
import {User} from "@user/models/user.model";
import {ImportUserFacade} from "@import-user/services/import-user.facade";

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html'
})
export class UserFormComponent extends AbstractModalComponent implements OnInit, OnDestroy, AfterViewInit {

  @Input()
  set importUsersRaw(importUsersRaw: ImportUserRaw[]) {
    this._importUsersRaw = importUsersRaw;
  }

  get importUsersRaw() {
    return this._importUsersRaw;
  }

  @Input() importButtonClickedEvent$: Observable<void>;
  @Output() importClickEvent = new EventEmitter<ImportUserRaw[]>();
  @Output() formIsValidEvent = new EventEmitter<boolean>();

  @ViewChildren('userList') userList: QueryList<ElementRef>;

  private unsubscribe$ = new Subject();

  _importUsersRaw: ImportUserRaw[] = [];

  formGroup: FormGroup;
  existingRoles = Role.ALL;
  users:  User[]
  importUser: ImportUser[]

  get userGroupArray(): FormArray {
    return this.formGroup.get('userGroups') as FormArray;
  }

  constructor(private formBuilder: FormBuilder,
              protected modalRef: NgbActiveModal,
              private platform: PlatformLocation,
              private cdr: ChangeDetectorRef,
              private userFacade: UserFacade,
              private importUserFacade: ImportUserFacade) {
    super(modalRef, platform);
  }

  ngOnInit() {
    if (!this.formGroup) { this.initForm(); }
    this.importButtonClickedEvent$.subscribe(() => {
      this.onImportClick();
      this.cdr.detectChanges();
    });

    this.userFacade.getUsers()
      .pipe(first())
      .subscribe(users => {
        this.users = users;
      });

    this.importUserFacade.getImportedUsers()
      .pipe(first())
      .subscribe(importUser => {
        this.importUser = importUser;
      });


  }

  ngAfterViewInit() {
    this.userList.changes
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        const i: number = this.userGroupArray.length - 1;
        const element = document.getElementById(`userUid_${i}`);
        if (element) { element.focus(); }
        this.cdr.detectChanges();
      });
    this.updateValidation();
  }

  private initForm() {
    this.formGroup = this.formBuilder.group({
      userGroups: this.formBuilder.array([], [Validators.required])
    });

    if (this.importUsersRaw) {
      this.importUsersRaw.forEach(user => {
        this.userGroupArray.push(this.createUserGroup(user));
      });
    }
  }

  createUserGroup(user: ImportUserRaw = null): FormGroup {
    if (user) {
      if (user.hasOwnProperty('role')) {
        const isValidRole = Role.isValidRole(user.role);
        if (!isValidRole) {
          user.role = null;
        }
      } else {
        user.role = Role.MEMBER.value;
      }
    }

    return this.formBuilder.group({
      uid: [user && user.uid || '', [Validators.required, this.duplicateControlValidator()]],
      name1: [user && user.name1 || ''],
      name2: [user && user.name2 || ''],
      role: [user && user.role || null, Validators.required]
    });
  }

  duplicateControlValidator(): ValidatorFn {
    return (control: FormControl): ValidationErrors | null => {
      if (control.parent == null) { return null; }

      const parentGroup = control.parent as FormGroup;
      const parentArray = parentGroup.parent as FormArray;

      const uidValues = parentArray.controls.map(userGroup =>
        userGroup.get('uid').value);

      const importFormDuplicate = uidValues.filter(x => x === control.value).length > 1
      const userWithRoleDuplicate = this.users.filter(x => x.role.value != Role.NONE.value).some(r => control.value == r.resolvedClaim.uid)
      const importedDuplicate = this.importUser.filter(x => x.role != 0).some(r => control.value == r.uid);

      return (importFormDuplicate || userWithRoleDuplicate || importedDuplicate) ? {duplicate: 'duplicate'} : null;
    };
  }

  updateValidation() {
    this.userGroupArray.controls.forEach(userGroup => {
      userGroup.get('uid').updateValueAndValidity();
      userGroup.get('role').updateValueAndValidity();
    });
    this.formIsValidEvent.emit(this.formIsValid());
  }

  addUser() {
    this.userGroupArray.push(this.createUserGroup());
    this.updateValidation();
  }

  removeUser(index: number) {
    this.userGroupArray.removeAt(index);
    this.updateValidation();
  }

  onImportClick() {
    const outgoingImportUsers: ImportUserRaw[] = [];
    this.userGroupArray.controls.forEach(group => {
      outgoingImportUsers.push(<ImportUserRaw>{
        uid: group.get('uid').value,
        name1: group.get('name1').value,
        name2: group.get('name2').value,
        role: group.get('role').value,
      });
    });

    this.importClickEvent.emit(outgoingImportUsers);
  }

  formIsValid(): boolean {
    return this.userGroupArray.length !== 0 && this.formGroup.valid;
  }

  formRowIsInvalid(userGroup: AbstractControl): boolean {
    return (userGroup.get('uid').value === ''
      || userGroup.get('uid').hasError('duplicate')
      || !userGroup.get('role').value);
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
