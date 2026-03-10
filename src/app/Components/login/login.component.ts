import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/Services/auth.service';
import { HeaderMenusService } from 'src/app/Services/header-menus.service';
import { LocalStorageService } from 'src/app/Services/local-storage.service';
import { SharedService } from 'src/app/Services/shared.service';
import { AuthDTO } from '../../Models/auth.dto';
import { HeaderMenus } from '../../Models/header-menus.dto';

type LoginFormModel = {
  email: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  // TODO 19
  loginUser: AuthDTO;
  email: FormControl<string>;
  password: FormControl<string>;
  loginForm: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  submitted = false;
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private sharedService: SharedService,
    private headerMenusService: HeaderMenusService,
    private localStorageService: LocalStorageService,
    private router: Router,
    private fb: NonNullableFormBuilder,
  ) {
    // TODO 20
    this.loginUser = new AuthDTO('', '', '', '');

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

    this.loginForm = this.fb.group<LoginFormModel>({
      email: this.email,
      password: this.password,
    });
  }

  ngOnInit(): void {}

  async login(): Promise<void> {
    this.submitted = true;
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) return;
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    let responseOK = false;
    let errorResponse: any;

    const { email, password } = this.loginForm.getRawValue();

    this.loginUser.email = email;
    this.loginUser.password = password;

    try {
      const authToken = await this.authService.login(this.loginUser);

      responseOK = true;
      this.loginUser.user_id = authToken.user_id;
      this.loginUser.access_token = authToken.access_token;

      // Save token to localStorage
      this.localStorageService.set('user_id', this.loginUser.user_id);
      this.localStorageService.set('access_token', this.loginUser.access_token);
    } catch (error: any) {
      responseOK = false;
      errorResponse = error.error;

      const headerInfo: HeaderMenus = {
        showAuthSection: false,
        showNoAuthSection: true,
      };

      this.headerMenusService.headerManagement.next(headerInfo);
      this.sharedService.errorLog(error.error);
    } finally {
      this.isSubmitting = false;
    }

    await this.sharedService.managementToast(
      'loginFeedback',
      responseOK,
      errorResponse,
    );

    if (responseOK) {
      const headerInfo: HeaderMenus = {
        showAuthSection: true,
        showNoAuthSection: false,
      };

      this.headerMenusService.headerManagement.next(headerInfo);
      this.loginForm.reset();
      this.submitted = false;
      this.router.navigateByUrl('home');
    }
  }
}
