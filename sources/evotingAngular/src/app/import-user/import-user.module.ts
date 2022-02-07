/**
 DecentraVote
 Copyright (C) 2018-2022 iteratec
 */
import {NgModule} from '@angular/core';
import {EffectsModule} from '@ngrx/effects';
import {ImportUserEffects} from '@import-user/+state/import-user.effects';
import { RemoveImportUserModalComponent } from './components/remove-import-user/remove-import-user-modal.component';
import {TranslateModule} from '@ngx-translate/core';
import {CoreModule} from '@core/core.module';
import {CommonModule} from '@angular/common';
import { ImportUserAccessCodeModalComponent } from './components/import-user-access-code-modal/import-user-access-code-modal.component';
import {ReactiveFormsModule} from '@angular/forms';
import { ImportUserEditModalComponent } from './components/import-user-edit-modal/import-user-edit-modal.component';
import {ClipboardModule} from "@angular/cdk/clipboard";

const COMPONENTS = [
  ImportUserAccessCodeModalComponent,
  RemoveImportUserModalComponent
];

const MODAL_COMPONENTS = [
];

@NgModule({
  declarations: [COMPONENTS, MODAL_COMPONENTS, ImportUserEditModalComponent],
  entryComponents: [MODAL_COMPONENTS],
    imports: [
        EffectsModule.forFeature([ImportUserEffects]),
        TranslateModule,
        CommonModule,
        CoreModule,
        ReactiveFormsModule,
        ClipboardModule,
    ],
  exports: [COMPONENTS, MODAL_COMPONENTS],
})
export class ImportUserModule {
}
