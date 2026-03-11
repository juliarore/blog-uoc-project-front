import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { LocalStorageService } from 'src/app/Services/local-storage.service';
import { SharedService } from 'src/app/Services/shared.service';
import { UserService } from 'src/app/Services/user.service';
import { UserDTO } from '../../Models/user.dto';

type ProfileFormModel = {
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
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  // TODO: implementar tipo ProfileFormModel

  // TODO 4
  profileUser: UserDTO;

  name: FormControl<string>;
  surname_1: FormControl<string>;
  surname_2: FormControl<string>;
  alias: FormControl<string>;
  birth_date: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;

  profileForm: FormGroup<ProfileFormModel>;
  isValidForm: boolean | null;
  submitted = false;
  isSubmitting = false;

  constructor(
    private userService: UserService,
    private sharedService: SharedService,
    private localStorageService: LocalStorageService,
    private fb: NonNullableFormBuilder,
  ) {
    // TODO 5
    this.profileUser = new UserDTO('', '', '', '', new Date(), '', '');
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

    this.profileForm = this.fb.group<ProfileFormModel>({
      name: this.name,
      surname_1: this.surname_1,
      surname_2: this.surname_2,
      alias: this.alias,
      birth_date: this.birth_date,
      email: this.email,
      password: this.password,
    });
  }

  async ngOnInit(): Promise<void> {
    let errorResponse: any;

    const userId = this.localStorageService.get('user_id');
    if (!userId) return;

    try {
      const userData = await this.userService.getUSerById(userId);

      this.profileForm.patchValue({
        name: userData.name,
        surname_1: userData.surname_1,
        surname_2: userData.surname_2 ?? '',
        alias: userData.alias,
        birth_date: formatDate(userData.birth_date, 'yyyy-MM-dd', 'en'),
        email: userData.email,
        // password NO se rellena desde backend (normalmente)
      });
    } catch (error: any) {
      errorResponse = error.error;
      this.sharedService.errorLog(errorResponse);
    }
  }

  async updateUser(): Promise<void> {
    this.submitted = true;
    this.profileForm.markAllAsTouched();

    if (this.profileForm.invalid) return;
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    let responseOK = false;
    this.isValidForm = false;
    let errorResponse: any;

    this.isValidForm = true;

    const userId = this.localStorageService.get('user_id');
    if (!userId) {
      this.isSubmitting = false;
      return;
    }

    const raw = this.profileForm.getRawValue();

    // Parse de fecha (evita problemas de zona horaria)
    const [y, m, d] = raw.birth_date.split('-').map(Number);
    const birthDate = new Date(y, m - 1, d);

    this.profileUser = new UserDTO(
      raw.name,
      raw.surname_1,
      raw.surname_2 ?? '',
      raw.alias,
      birthDate,
      raw.email,
      raw.password,
    );

    try {
      await this.userService.updateUser(userId, this.profileUser);
      responseOK = true;
    } catch (error: any) {
      responseOK = false;
      errorResponse = error.error;
      this.sharedService.errorLog(errorResponse);
    } finally {
      this.isSubmitting = false;
    }

    await this.sharedService.managementToast(
      'profileFeedback',
      responseOK,
      errorResponse,
    );
  }
}
