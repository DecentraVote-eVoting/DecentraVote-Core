/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {ethers, Wallet} from 'ethers';
import {ObjectUtil} from '@core/utils/object.util';
import {REGEX_PASSWORD, REGEX_PASSWORD_LETTER, REGEX_PASSWORD_NUMBER} from '@core/models/common.model';
import {jwtUser} from '@user/models/user.model';

@Component({
  selector: 'app-setup-mnemonic-password',
  templateUrl: './setup-mnemonic-password.component.html'
})
export class SetupMnemonicPasswordComponent implements AfterViewInit {

  @Input()
  set isCreatingNew(isCreatingNew: boolean) {
    this._isCreatingNew = isCreatingNew;
    if (isCreatingNew) {
      const newWallet = Wallet.createRandom();
      this.address = newWallet.address;
      this.mnemonicControl.setValue(newWallet.mnemonic.phrase);
      this.mnemonicControl.disable();
    } else {
      this.mnemonicControl.setValue('');
      this.mnemonicControl.enable();
    }
  }

  get isCreatingNew(): boolean {
    return this._isCreatingNew;
  }

  @Input() jwtUser: jwtUser;

  @Output() createMnemonicAction = new EventEmitter<object>();
  @Output() backAction = new EventEmitter<void>();

  address = '';
  mnemonicControl = new FormControl();
  copiedToClipboard = false;
  _isCreatingNew = true;

  passwordControl = new FormControl('', Validators.pattern(REGEX_PASSWORD));
  confirmPasswordControl = new FormControl('', Validators.pattern(REGEX_PASSWORD));

  @ViewChild('passwordInput') passwordInput: ElementRef;
  @ViewChild('mnemonicInput') mnemonicInput: ElementRef;

  constructor() {
  }

  ngAfterViewInit() {
    if (this.mnemonicInput && !this.isCreatingNew) {
      this.mnemonicInput.nativeElement.focus();
    }
  }

  isMnemonicValid(): boolean {
    return !ObjectUtil.isNullOrUndefined(this.mnemonicControl.value) && this.mnemonicControl.value !== ''
      && ethers.utils.isValidMnemonic(this.mnemonicControl.value);
  }

  setCopyToClipboardSuccessful() {
    if (this.isCreatingNew) {
      this.copiedToClipboard = true;
      // ObjectUtil.copyToClipboard(this.mnemonicControl.value);
      // ObjectUtil.copyToClipboardFromInputElement(mnemonicInput); // workaround for iOS
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
    if (this.isPasswordValid() && this.isMnemonicValid()) {
      this.createMnemonicAction.emit({
        mnemonic: this.mnemonicControl.value,
        password: this.passwordControl.value,
        address: this.address
      });
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
