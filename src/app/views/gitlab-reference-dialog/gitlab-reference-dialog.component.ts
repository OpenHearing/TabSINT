import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-gitlab-dialog',
  standalone: true,
  templateUrl: './gitlab-reference-dialog.component.html',
  styleUrl: './gitlab-reference-dialog.component.css',
  imports: [CommonModule, FormsModule, TranslocoPipe, MatDialogModule, MatRadioModule, MatButtonModule],
})
export class GitlabReferenceDialog {
  private readonly dialogRef = inject(MatDialogRef<GitlabReferenceDialog>);
  static readonly OPTION_TAG = 'TAG';
  static readonly OPTION_COMMIT = 'COMMIT';

  selectedOption = GitlabReferenceDialog.OPTION_TAG;
  optionTag = GitlabReferenceDialog.OPTION_TAG;
  optionCommit = GitlabReferenceDialog.OPTION_COMMIT;

  confirm(): void {
    this.dialogRef.close(this.selectedOption);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
