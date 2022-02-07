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
  ViewChild,
  ViewChildren
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AbstractModalComponent} from '@core/components/abstract-modal/abstract-modal.component';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {VoteFacade} from '@voting/services/vote.facade';
import {CreateVoteModel, VoteOption} from '@voting/models/vote.model';
import {PlatformLocation} from '@angular/common';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ToasterService} from '@core/services/toaster.service';
import {ToasterType} from '@core/models/toaster.model';

@Component({
  selector: 'app-create-voting-modal',
  templateUrl: './create-voting-modal.component.html',
})
export class CreateVotingModalComponent extends AbstractModalComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() prefillData: CreateVoteModel;
  @Input() isInModal = true;
  @Input() isEdit = false;

  @Output() createAction = new EventEmitter<CreateVoteModel>();

  @ViewChild('fileInput') fileInput: any;
  @ViewChildren('optionsList') optionsList: QueryList<ElementRef>;

  private unsubscribe$ = new Subject();

  formGroup: FormGroup;

  fileToUpload: File = null;
  // extension check currently not in place, see validateAttachment()
  validExtensions = ['txt', 'csv', 'json', 'xlsx', 'png', 'jpg', 'jpeg', 'pdf', 'pptx'];
  maxFileSize = 20 * 10 ** 6;
  fileHasInvalidExtension = false;
  fileIsTooLarge = false;

  private translatePipe = new TranslatePipe(this.translateService, this.cdr);

  constructor(protected modalRef: NgbActiveModal,
              private fb: FormBuilder,
              private voteFacade: VoteFacade,
              private translateService: TranslateService,
              private platform: PlatformLocation,
              private cdr: ChangeDetectorRef,
              private toasterService: ToasterService) {
    super(modalRef, platform);
  }

  ngOnInit() {
    this.initForm();
  }

  ngAfterViewInit() {
    this.optionsList.changes
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => {
        const i: number = this.votingOptionsArray.length - 1;
        document.getElementById(`optionInput_${i}`).focus();
      });
  }

  private initForm() {
    this.formGroup = this.fb.group({
      title: [this.prefillData && this.prefillData.title || '', [Validators.required, Validators.maxLength(200)]],
      description: [this.prefillData && this.prefillData.description || ''],
      from: [(new Date()).toISOString().substring(0, 10)],
      votingOptions: this.fb.array([], [Validators.required]),
      anonymous: [this.prefillData.isAnonymous],
    });


    if (this.prefillData && this.prefillData.attachment) {
      this.fileToUpload = new File([this.prefillData.attachment], this.prefillData.filename);
    }

    if (this.prefillData && this.prefillData.voteOptions && this.prefillData.voteOptions.length > 0) {
      this.prefillData.voteOptions.forEach(option => this.votingOptionsArray.push(this.createOptionControl(option.value)));
    } else {
      VoteOption.LIST.forEach(option => this.votingOptionsArray
        .push(this.createOptionControl(this.translatePipe.transform(option.value))));
    }
  }

  createVote() {
    const vote: CreateVoteModel = {
      address: this.isEdit ? this.prefillData.address : '',
      meetingAddress: this.prefillData && this.prefillData.meetingAddress,
      title: this.formGroup.get('title').value,
      description: this.formGroup.get('description').value,
      isAnonymous: this.formGroup.get('anonymous').value,
      attachment: this.prefillData.attachment,
      filename: this.prefillData.filename
    };

    this.voteFacade.createVote(vote, this.votingOptionsArray.value, this.fileToUpload, this.isEdit);

    if (this.isInModal) {
      this.modalRef.close();
    }

    this.createAction.emit(vote);
  }

  addOption() {
    this.votingOptionsArray.push(this.createOptionControl());
    this.updateValidation();
  }

  removeOption(index: number) {
    if (this.votingOptionsArray.length !== 1) {
      this.votingOptionsArray.removeAt(index);
    }
    this.updateValidation();
  }

  onUpload(event: EventTarget) {
    const element = event as HTMLInputElement;
    if (this.prefillData.attachment && element.files.length === 0) {
      const file = new File([this.prefillData.attachment], this.prefillData.filename);
      if (this.validateAttachment(file)) {
        this.fileToUpload = file;
      }
    } else {
      if (this.validateAttachment(element.files.item(0))) {
        this.fileToUpload = element && element.files && element.files.item(0);
      }
    }
    this.fileInput.nativeElement.value = null;
  }

  removeUpload() {
    if (this.fileToUpload) {
      this.fileToUpload = null;
    }
  }

  get votingOptionsArray(): FormArray {
    return this.formGroup && this.formGroup.get('votingOptions') as FormArray;
  }

  createOptionControl(value: string = ''): FormControl {
    return new FormControl(value, [Validators.required, this.duplicateControlValidator()]);
  }

  duplicateControlValidator(): ValidatorFn {
    return (control: FormControl): ValidationErrors | null => {
      let result: boolean;
      if (control.parent == null) { return null; }
      const parent = control.parent as FormArray;
      const values = parent.controls.map(c => c.value);
      result = values.filter(x => x === control.value).length > 1;
      return result ? {duplicate: 'Duplicate'} : null;
    };
  }

  updateValidation() {
    this.votingOptionsArray.controls.forEach(from => from.updateValueAndValidity());
  }

  validateAttachment(file: File): boolean {
    let errorString = '';

    // remove 'false &&' to reimplement extension check
    if (false && !this.validExtensions.includes(file.type.split('/')[1])) {
      this.fileHasInvalidExtension = true;
      this.fileIsTooLarge = false;
      errorString = 'Voting.Error-Invalid-Attachment-Extension';
    } else if (file.size > this.maxFileSize) {
      this.fileIsTooLarge = true;
      this.fileHasInvalidExtension = false;
      errorString = 'Voting.Error-Invalid-Attachment-Size';
    } else {
      this.fileHasInvalidExtension = false;
      this.fileIsTooLarge = false;
    }

    if (this.fileIsTooLarge || this.fileHasInvalidExtension) {
      this.toasterService.addToaster({
        type: ToasterType.ERROR,
        message: errorString
      });
      return false;
    }

    return true;
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
