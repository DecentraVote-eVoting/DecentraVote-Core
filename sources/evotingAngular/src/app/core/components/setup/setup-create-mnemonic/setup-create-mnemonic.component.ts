/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ethers, Wallet} from 'ethers';
import {ObjectUtil} from '@core/utils/object.util';

@Component({
  selector: 'app-setup-create-mnemonic',
  templateUrl: './setup-create-mnemonic.component.html'
})
export class SetupCreateMnemonicComponent implements AfterViewInit {

  @Input()
  set isCreatingNew(isCreatingNew: boolean) {
    this._isCreatingNew = isCreatingNew;
    if (isCreatingNew) {
      this.mnemonicControl.setValue(Wallet.createRandom().mnemonic.phrase);
      this.mnemonicControl.disable();
    } else {
      this.mnemonicControl.setValue('');
      this.mnemonicControl.enable();
    }
  }

  get isCreatingNew(): boolean {
    return this._isCreatingNew;
  }

  @Output() createMnemonicAction = new EventEmitter<string>();
  @Output() backAction = new EventEmitter<void>();

  mnemonicControl = new FormControl();
  copiedToClipboard = false;
  _isCreatingNew = true;

  @ViewChild('mnemonicInput') mnemonicInput: ElementRef;

  constructor() {
  }

  ngAfterViewInit() {
    if (this.mnemonicInput) {
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

}
