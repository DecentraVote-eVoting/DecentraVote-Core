/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {ObjectUtil} from '@core/utils/object.util';
import {REGEX_PASSWORD, REGEX_PASSWORD_LETTER, REGEX_PASSWORD_NUMBER} from '@core/models/common.model';

@Component({
  selector: 'app-setup-create-password',
  templateUrl: './setup-create-password.component.html'
})
export class SetupCreatePasswordComponent implements AfterViewInit {

  @Output() createPasswordAction = new EventEmitter<string>();
  @Output() backAction = new EventEmitter<void>();

  passwordControl = new FormControl('', Validators.pattern(REGEX_PASSWORD));
  confirmPasswordControl = new FormControl('', Validators.pattern(REGEX_PASSWORD));

  @ViewChild('passwordInput') passwordInput: ElementRef;

  constructor() {
  }

  ngAfterViewInit() {
    if (this.passwordInput) {
      this.passwordInput.nativeElement.focus();
    }
  }

  isPasswordValid(): boolean {
    return !ObjectUtil.isNullOrUndefined(this.passwordControl.value)
      && !ObjectUtil.isNullOrUndefined(this.confirmPasswordControl.value)
      && this.passwordControl.value !== '' && this.confirmPasswordControl.value !== ''
      && this.passwordControl.valid && this.confirmPasswordControl.valid
      && this.passwordControl.value === this.confirmPasswordControl.value;
  }

  onKeyup() {
    if (this.isPasswordValid()) {
      this.createPasswordAction.emit(this.passwordControl.value);
    }
  }

  hasEightLetters(): boolean {
    return !ObjectUtil.isNullOrUndefined(this.passwordControl.value)
      && this.passwordControl.value.length >= 8;
  }

  hasLetter(): boolean {
    return !ObjectUtil.isNullOrUndefined(this.passwordControl.value)
      && REGEX_PASSWORD_LETTER.test(this.passwordControl.value);
  }

  hasNumber(): boolean {
    return !ObjectUtil.isNullOrUndefined(this.passwordControl.value)
      && REGEX_PASSWORD_NUMBER.test(this.passwordControl.value);
  }

  passwordsNotEmpty(): boolean {
    return (!ObjectUtil.isNullOrUndefined(this.passwordControl.value)
      && this.passwordControl.value !== ''
      || !ObjectUtil.isNullOrUndefined(this.confirmPasswordControl.value)
      && this.confirmPasswordControl.value !== '');
  }

  passwordsMatch(): boolean {
    return !ObjectUtil.isNullOrUndefined(this.passwordControl.value)
      && !ObjectUtil.isNullOrUndefined(this.confirmPasswordControl.value)
      && this.passwordControl.value === this.confirmPasswordControl.value;
  }

}
