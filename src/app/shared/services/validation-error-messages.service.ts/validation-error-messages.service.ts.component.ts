import { Injectable } from '@angular/core';
import type { AbstractControl } from '@angular/forms';

export enum ValidationError {
  Required = 'required',
  Email = 'email',
  MinLength = 'minlength',
  MaxLength = 'maxlength',
  Min = 'min',
  Max = 'max',
  Pattern = 'pattern',
  Mask = 'mask',
  MustMatch = 'mustMatch',
  InvalidPhone = 'invalidPhone',
}

type ErrorMessage = string | ((error: unknown) => string);

const ERROR_MESSAGES: Partial<Record<ValidationError, ErrorMessage>> = {
  [ValidationError.Required]: 'Поле обязательно для заполнения',
  [ValidationError.Email]: 'Введите корректный email',
  [ValidationError.Pattern]: 'Неверный формат',
  [ValidationError.Mask]: 'Неверный формат',
  [ValidationError.MustMatch]: 'Пароли не совпадают',
  [ValidationError.InvalidPhone]: 'Введите корректный номер телефона',
  [ValidationError.MinLength]: (e: any) => `Минимум ${e.requiredLength} символов`,
  [ValidationError.MaxLength]: (e: any) => `Максимум ${e.requiredLength} символов`,
  [ValidationError.Min]: (e: any) => `Минимальное значение: ${e.min}`,
  [ValidationError.Max]: (e: any) => `Максимальное значение: ${e.max}`,
};

@Injectable({ providedIn: 'root' })
export class ValidationErrorMessagesService {
  getError(control: AbstractControl | null): string {
    if (!control?.errors) return '';

    const key = Object.keys(control.errors)[0] as ValidationError;
    const message = ERROR_MESSAGES[key];

    if (!message) return '';

    return typeof message === 'function' ? message(control.errors[key]) : message;
  }
}
