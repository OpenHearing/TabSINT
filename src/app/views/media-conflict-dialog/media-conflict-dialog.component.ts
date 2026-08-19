import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface MediaConflictDialogData {
  repository: string;
}

@Component({
  selector: 'app-media-conflict-dialog',
  standalone: true,
  templateUrl: './media-conflict-dialog.component.html',
  styleUrl: './media-conflict-dialog.component.css',
  imports: [CommonModule, TranslocoPipe, MatDialogModule, MatButtonModule],
})
export class MediaConflictDialog {
  private readonly dialogRef = inject(MatDialogRef<MediaConflictDialog>);
  readonly data = inject<MediaConflictDialogData>(MAT_DIALOG_DATA);
  static readonly OPTION_SKIP = 'SKIP';
  static readonly OPTION_OVERRIDE = 'OVERRIDE';

  readonly messageKey =
    'A media repository named "{{repository}}" is already downloaded. Overriding will re-download it and replace its contents, which may affect other protocols that use it. Skip to keep the existing copy, or Override to replace it.';

  get messageParams(): { repository: string } {
    return { repository: this.data.repository };
  }

  skip(): void {
    this.dialogRef.close(MediaConflictDialog.OPTION_SKIP);
  }

  override(): void {
    this.dialogRef.close(MediaConflictDialog.OPTION_OVERRIDE);
  }
}
