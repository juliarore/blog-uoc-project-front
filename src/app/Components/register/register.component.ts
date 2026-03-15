import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { UserDTO } from 'src/app/Models/user.dto';
import { HeaderMenusService } from 'src/app/Services/header-menus.service';
import { SharedService } from 'src/app/Services/shared.service';
import { UserService } from 'src/app/Services/user.service';
import { HeaderMenus } from '../../Models/header-menus.dto';

type RegisterFormModel = {
  name: FormControl<string>;
  surname_1: FormControl<string>;
  surname_2: FormControl<string>;
  alias: FormControl<string>;
  birth_date: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
};

// Patró data de naixement DD/MM/YYYY
const BIRTHDATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  registerUser: UserDTO;

  name: FormControl<string>;
  surname_1: FormControl<string>;
  surname_2: FormControl<string>;
  alias: FormControl<string>;
  birth_date: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;

  registerForm: FormGroup<RegisterFormModel>;
  isValidForm: boolean | null;
  submitted = false;
  isSubmitting = false;

  constructor(
    private userService: UserService,
    private sharedService: SharedService,
    private headerMenusService: HeaderMenusService,
    private router: Router,
    private fb: NonNullableFormBuilder,
  ) {
    this.registerUser = new UserDTO('', '', '', '', new Date(), '', '');
    this.isValidForm = null;

    this.name = this.fb.control('', {
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(25),
      ],
    });
    this.surname_1 = this.fb.control('', {
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(25),
      ],
    });
    this.surname_2 = this.fb.control('', {
      validators: [Validators.minLength(5), Validators.maxLength(25)],
    });
    this.alias = this.fb.control('', {
      validators: [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(25),
      ],
    });
    this.birth_date = this.fb.control('', {
      validators: [Validators.required, Validators.pattern(BIRTHDATE_PATTERN)],
    });
    this.email = this.fb.control('', {
      validators: [Validators.required, Validators.email],
    });
    this.password = this.fb.control('', {
      validators: [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(16),
      ],
    });

    this.registerForm = this.fb.group<RegisterFormModel>({
      name: this.name,
      surname_1: this.surname_1,
      surname_2: this.surname_2,
      alias: this.alias,
      birth_date: this.birth_date,
      email: this.email,
      password: this.password,
    });
  }

  ngOnInit(): void {}

  async register(): Promise<void> {
    this.submitted = true;
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) return;
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    let responseOK = false;
    this.isValidForm = false;
    let errorResponse: any;

    this.isValidForm = true;

    const raw = this.registerForm.getRawValue();

    // Convertir birth_date (string yyyy-MM-dd) a Date
    const birthDate = new Date(raw.birth_date);

    // surname_2: si viene vacío, pasamos string vacío para cumplir constructor
    const surname2 = raw.surname_2 ?? '';

    this.registerUser = new UserDTO(
      raw.name,
      raw.surname_1,
      surname2,
      raw.alias,
      birthDate,
      raw.email,
      raw.password,
    );

    try {
      await this.userService.register(this.registerUser);
      responseOK = true;
    } catch (error: any) {
      responseOK = false;
      errorResponse = error.error;

      const headerInfo: HeaderMenus = {
        showAuthSection: false,
        showNoAuthSection: true,
      };
      this.headerMenusService.headerManagement.next(headerInfo);

      this.sharedService.errorLog(errorResponse);
    } finally {
      this.isSubmitting = false;
    }

    await this.sharedService.managementToast(
      'registerFeedback',
      responseOK,
      errorResponse,
    );

    if (responseOK) {
      this.registerForm.reset();

      // Volver a setear el birth_date por defecto
      this.birth_date.setValue(formatDate(new Date(), 'yyyy-MM-dd', 'en'));

      this.submitted = false;
      this.router.navigateByUrl('home');
    }
  }
}
