import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostDTO } from 'src/app/Models/post.dto';
import { CategoryService } from 'src/app/Services/category.service';
import { LocalStorageService } from 'src/app/Services/local-storage.service';
import { PostService } from 'src/app/Services/post.service';
import { SharedService } from 'src/app/Services/shared.service';
import { CategoryDTO } from '../../../Models/category.dto';

type PostFormModel = {
  title: FormControl<string>;
  description: FormControl<string>;
  publication_date: FormControl<string>;
  categories: FormControl<string[]>;
};

@Component({
  selector: 'app-post-form',
  templateUrl: './post-form.component.html',
  styleUrls: ['./post-form.component.scss'],
})
export class PostFormComponent implements OnInit {
  private readonly publicationDatePattern: RegExp = /^\d{4}-\d{2}-\d{2}$/;

  post: PostDTO;
  availableCategories: CategoryDTO[];

  title: FormControl<string>;
  description: FormControl<string>;
  publication_date: FormControl<string>;
  categories: FormControl<string[]>;

  postForm: FormGroup<PostFormModel>;
  isValidForm: boolean | null;

  private isUpdateMode: boolean;
  private postId: string | null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private postService: PostService,
    private formBuilder: NonNullableFormBuilder,
    private router: Router,
    private sharedService: SharedService,
    private localStorageService: LocalStorageService,
    private categoryService: CategoryService,
  ) {
    this.isValidForm = null;
    this.postId = this.activatedRoute.snapshot.paramMap.get('id');
    this.post = new PostDTO('', '', 0, 0, new Date());
    this.post.categories = [];
    this.availableCategories = [];
    this.isUpdateMode = false;

    this.title = new FormControl(this.post.title, {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(55)],
    });

    this.description = new FormControl(this.post.description, {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    });

    this.publication_date = new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(this.publicationDatePattern),
      ],
    });

    this.categories = new FormControl([], {
      nonNullable: true,
      validators: [Validators.required],
    });

    this.postForm = this.formBuilder.group({
      title: this.title,
      description: this.description,
      publication_date: this.publication_date,
      categories: this.categories,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadCategories();

    let errorResponse: any;
    if (this.postId) {
      this.isUpdateMode = true;
      try {
        this.post = await this.postService.getPostById(this.postId);

        this.title.setValue(this.post.title);
        this.description.setValue(this.post.description);
        this.publication_date.setValue(
          this.formatDateForInput(this.post.publication_date),
        );
        this.categories.setValue(
          this.post.categories?.map((category) => category.categoryId) ?? [],
        );
      } catch (error: any) {
        errorResponse = error.error;
        this.sharedService.errorLog(errorResponse);
      }
    }
  }

  private async loadCategories(): Promise<void> {
    let errorResponse: any;
    const userId = this.localStorageService.get('user_id');

    if (userId) {
      try {
        this.availableCategories =
          await this.categoryService.getCategoriesByUserId(userId);
      } catch (error: any) {
        errorResponse = error.error;
        this.sharedService.errorLog(errorResponse);
      }
    }
  }

  private formatDateForInput(date: Date | string): string {
    return new Date(date).toISOString().split('T')[0];
  }

  private async editPost(): Promise<boolean> {
    let errorResponse: any;
    let responseOK: boolean = false;
    if (this.postId) {
      const userId = this.localStorageService.get('user_id');
      if (userId) {
        this.post.userId = userId;
        try {
          await this.postService.updatePost(this.postId, this.post);
          responseOK = true;
        } catch (error: any) {
          errorResponse = error.error;
          this.sharedService.errorLog(errorResponse);
        }

        await this.sharedService.managementToast(
          'postFeedback',
          responseOK,
          errorResponse,
        );

        if (responseOK) {
          this.router.navigateByUrl('posts');
        }
      }
    }

    return responseOK;
  }

  private async createPost(): Promise<boolean> {
    let errorResponse: any;
    let responseOK: boolean = false;
    const userId = this.localStorageService.get('user_id');
    if (userId) {
      this.post.userId = userId;
      try {
        await this.postService.createPost(this.post);
        responseOK = true;
      } catch (error: any) {
        errorResponse = error.error;
        this.sharedService.errorLog(errorResponse);
      }

      await this.sharedService.managementToast(
        'postFeedback',
        responseOK,
        errorResponse,
      );

      if (responseOK) {
        this.router.navigateByUrl('posts');
      }
    }

    return responseOK;
  }

  async savePost() {
    this.isValidForm = false;

    if (this.postForm.invalid) {
      return;
    }

    this.isValidForm = true;
    const { title, description, publication_date, categories } =
      this.postForm.getRawValue();
    const selectedCategories = this.availableCategories.filter((category) =>
      categories.includes(category.categoryId),
    );

    // The form stores UI-friendly values (date string + selected category ids).
    // Here we map them to the DTO structure expected by the API.
    this.post = new PostDTO(
      title,
      description,
      this.post.num_likes ?? 0,
      this.post.num_dislikes ?? 0,
      new Date(publication_date),
    );
    this.post.categories = selectedCategories;

    if (this.isUpdateMode) {
      await this.editPost();
    } else {
      await this.createPost();
    }
  }
}
