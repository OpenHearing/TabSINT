import { CommonResponseAreaInterface } from '../../../../interfaces/page-definition.interface';

/**
 * The scope of the QR code scan result.
 *
 * If scope is 'exam', then setting this QR code sets the single exam-wide QR code.
 * If 'page', the the code is only recorded as an answer for this page.
 */
export enum QrCodeResponseAreaScope {
  Exam = 'exam',
  Page = 'page',
}

/**
 * Interface for the QR code response area.
 */
export interface QrCodeResponseAreaInterface extends CommonResponseAreaInterface {
  scope: QrCodeResponseAreaScope;
  autoSubmit?: true;
}
