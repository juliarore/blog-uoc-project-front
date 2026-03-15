import { Component } from '@angular/core';
import { HeaderMenus } from 'src/app/Models/header-menus.dto';
import { PostDTO } from 'src/app/Models/post.dto';
import { HeaderMenusService } from 'src/app/Services/header-menus.service';
import { LocalStorageService } from 'src/app/Services/local-storage.service';
import { PostService } from 'src/app/Services/post.service';
import { SharedService } from 'src/app/Services/shared.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  posts!: PostDTO[];
  showButtons: boolean;
  constructor(
    private postService: PostService,
    private localStorageService: LocalStorageService,
    private sharedService: SharedService,
    private headerMenusService: HeaderMenusService,
  ) {
    this.showButtons = false;
    this.loadPosts();
  }

  ngOnInit(): void {
    this.syncButtonsWithSession();

    this.headerMenusService.headerManagement.subscribe(
      (headerInfo: HeaderMenus) => {
        if (headerInfo) {
          const hasToken = !!this.localStorageService.get('access_token');
          this.showButtons = hasToken || headerInfo.showAuthSection;
        }
      },
    );
  }

  private syncButtonsWithSession(): void {
    this.showButtons = !!this.localStorageService.get('access_token');
  }

  private async loadPosts(): Promise<void> {
    let errorResponse: any;
    this.syncButtonsWithSession();

    try {
      this.posts = await this.postService.getPosts();
    } catch (error: any) {
      errorResponse = error.error;
      this.sharedService.errorLog(errorResponse);
    }
  }

  getCategoryBackgroundColor(cssColor: string): string {
    const normalizedColor = cssColor.startsWith('#')
      ? cssColor
      : `#${cssColor}`;
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalizedColor)
      ? normalizedColor
      : '#d9d9d9';
  }

  async like(postId: string): Promise<void> {
    let errorResponse: any;
    try {
      await this.postService.likePost(postId);
      this.loadPosts();
    } catch (error: any) {
      errorResponse = error.error;
      this.sharedService.errorLog(errorResponse);
    }
  }

  async dislike(postId: string): Promise<void> {
    let errorResponse: any;
    try {
      await this.postService.dislikePost(postId);
      this.loadPosts();
    } catch (error: any) {
      errorResponse = error.error;
      this.sharedService.errorLog(errorResponse);
    }
  }
}
