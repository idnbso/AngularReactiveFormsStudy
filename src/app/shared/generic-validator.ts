import { FormGroup } from '@angular/forms';
import { ElementRef } from '@angular/core';

import { Observable, Subscription, fromEvent, merge } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export class GenericValidator {
  public displayMessage: { [key: string]: string } = {};

  // Provide the set of valid validation messages
  // Stucture:
  // controlName1: {
  //     validationRuleName1: 'Validation Message.',
  //     validationRuleName2: 'Validation Message.'
  // },
  // controlName2: {
  //     validationRuleName1: 'Validation Message.',
  //     validationRuleName2: 'Validation Message.'
  // }
  constructor(
    private container: FormGroup,
    private validationMessages: { [key: string]: { [key: string]: string } }
  ) {}

  setupMessages(formInputElements: ElementRef[]): void {
    // Watch for the blur event from any input element on the form.
    // This is required because the valueChanges does not provide notification on blur
    const controlBlurs: Observable<any>[] = formInputElements.map(
      (formControl: ElementRef) => fromEvent(formControl.nativeElement, 'blur')
    );

    // Merge the blur event observable with the valueChanges observable
    // so we only need to subscribe once.
    merge(this.container.valueChanges, ...controlBlurs)
      .pipe(debounceTime(800))
      .subscribe(() => {
        this.displayMessage = this.processMessages();
      });
  }

  // Processes each control within a FormGroup
  // And returns a set of validation messages to display
  // Structure
  // controlName1: 'Validation Message.',
  // controlName2: 'Validation Message.'
  processMessages(): { [key: string]: string } {
    const messages = {};
    for (const controlKey in this.container.controls) {
      if (!this.container.controls.hasOwnProperty(controlKey)) {
        continue;
      }

      const control = this.container.controls[controlKey];
      // If it is a FormGroup, process its child controls.
      if (control instanceof FormGroup) {
        const childMessages = this.processMessages();
        Object.assign(messages, childMessages);
        continue;
      }

      // Only validate if there are validation messages for the control
      if (!this.validationMessages[controlKey]) {
        continue;
      }

      messages[controlKey] = '';
      if ((control.dirty || control.touched) && control.errors) {
        Object.keys(control.errors).map((messageKey) => {
          const message = this.validationMessages[controlKey][messageKey];
          if (message) {
            messages[controlKey] += message + ' ';
          }
        });
      }
    }

    return messages;
  }
}
