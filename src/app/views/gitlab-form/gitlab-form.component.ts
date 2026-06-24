import { Component, EventEmitter, Output, Input, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { GitlabConfigInterface } from '../../models/disk/disk.interface';
import { Notifications } from '../../services/notifications.service';
import { DialogType } from '../../utilities/constants';

interface InternalField {
  value: string | undefined;
  placeholder: string;
  popover: string;
}

@Component({
  selector: 'app-gitlab-form-view',
  templateUrl: './gitlab-form.component.html',
  styleUrl: './gitlab-form.component.css',
})
export class GitlabFormComponent {
  @Input() initialConfig?: Partial<GitlabConfigInterface>;
  @Output() submitConfig = new EventEmitter<GitlabConfigInterface>();

  private readonly transloco = inject(TranslocoService);
  private readonly notifications = inject(Notifications);

  protected repository: InternalField = {
    placeholder: 'Name',
    popover: this.gitlabAddPopover,
    value: this.initialConfig?.repository,
  };
  protected tag: InternalField = {
    placeholder: 'Latest',
    popover: this.gitlabAddVersionPopover,
    value: this.initialConfig?.tag,
  };
  protected host: InternalField = {
    placeholder: 'https://gitlab.com',
    popover: this.gitlabHostPopover,
    value: this.initialConfig?.host ?? 'https://gitlab.com',
  };
  protected token: InternalField = {
    placeholder: 'Token',
    popover: this.gitlabTokenPopover,
    value: this.initialConfig?.token,
  };
  protected group: InternalField = {
    placeholder: 'Group',
    popover: this.gitlabNamespacePopover,
    value: this.initialConfig?.group,
  };

  /**
   * Emit a configuration if it is valid.
   */
  validateAndEmit() {
    const gitlabConfig = this.validate();
    if (gitlabConfig !== undefined) {
      this.submitConfig.emit(gitlabConfig);
    }
  }

  /**
   * Validate a user defined configuration and show notifications based on result.
   * @returns The configuration if valid, otherwise undefined.
   */
  private validate(): GitlabConfigInterface | undefined {
    if (!this.host.value || !this.token.value || !this.group.value || !this.repository.value) {
      this.notifications
        .alert({
          title: 'Alert',
          content: 'Missing required GitLab configuration. Please specify a GitLab host, token, group, and repository.',
          type: DialogType.Alert,
        })
        .subscribe();
      return undefined;
    }
    // Detect if there "/" in the repository name and alert user
    if (this.repository.value.includes('/')) {
      this.notifications
        .alert({
          title: 'Alert',
          content: "Repository name should not contain any '/'. If applicable, please move the parent directories to the group field.",
          type: DialogType.Alert,
        })
        .subscribe();
      // move the "/" to the group field and remove from repository field
      if (!this.group.value.endsWith('/')) {
        this.group.value = this.group.value + '/';
      }
      if (this.repository.value.endsWith('/')) {
        this.repository.value = this.repository.value.slice(0, -1);
      }
      // move "/"s (directories) from repository to group
      const tmpGroup = this.group.value + this.repository.value.split('/').slice(0, -1).join('/');
      const tmpRepository = this.repository.value.split('/')[this.repository.value.split('/').length - 1];
      this.repository.value = tmpRepository;
      this.group.value = tmpGroup;
      return undefined;
    }
    // fix issue if a trailing "/" is in the group field
    if (this.group.value.endsWith('/')) {
      this.group.value = this.group.value.slice(0, -1);
    }
    if (!this.host.value || !this.token.value || !this.group.value || !this.repository.value) {
      return undefined;
    }

    return {
      repository: this.repository.value,
      tag: this.tag.value ?? '',
      host: this.host.value,
      token: this.token.value,
      group: this.group.value,
    };
  }

  get gitlabAddPopover() {
    return this.transloco.translate(
      'Type in the name of the repository located on the host and group. If applicable, put all parent directories in the group field.'
    );
  }
  get gitlabAddVersionPopover() {
    return this.transloco.translate(
      '<strong>OPTIONAL:</strong> Type in the repository tag for the version of the repository you would like to download. Leave blank to download the latest tag/commit from the repository.'
    );
  }
  get gitlabHostPopover() {
    return this.transloco.translate('Hostname of the gitlab server instance you are running. Generally this will be "https://gitlab.com/"');
  }
  get gitlabTokenPopover() {
    return this.transloco.translate(
      'The secret token used to access your gitlab repositories. See the user guide for more information about finding the Token.'
    );
  }
  get gitlabNamespacePopover() {
    return this.transloco.translate('The group where repositories are stored.');
  }
}
