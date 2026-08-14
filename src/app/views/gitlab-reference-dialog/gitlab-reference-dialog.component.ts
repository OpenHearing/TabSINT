import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';

export interface GitlabReferenceDialogData {
  title?: string;
  description?: string;
}

@Component({
  selector: 'app-gitlab-dialog',
  standalone: true,
  templateUrl: './gitlab-reference-dialog.component.html',
  styleUrl: './gitlab-reference-dialog.component.css',
  imports: [CommonModule, FormsModule, TranslocoPipe, MatDialogModule, MatRadioModule, MatButtonModule],
})
export class GitlabReferenceDialog {
  private readonly dialogRef = inject(MatDialogRef<GitlabReferenceDialog>);
  private readonly data = inject<GitlabReferenceDialogData | null>(MAT_DIALOG_DATA, { optional: true });
  static readonly OPTION_TAG = 'TAG';
  static readonly OPTION_COMMIT = 'COMMIT';

  selectedOption = GitlabReferenceDialog.OPTION_TAG;
  optionTag = GitlabReferenceDialog.OPTION_TAG;
  optionCommit = GitlabReferenceDialog.OPTION_COMMIT;

  get title(): string {
    return this.data?.title ?? 'Select GitLab Reference';
  }

  get description(): string {
    return this.data?.description ?? 'Choose which reference source is used when pulling data from a GitLab repository.';
  }

  confirm(): void {
    this.dialogRef.close(this.selectedOption);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
