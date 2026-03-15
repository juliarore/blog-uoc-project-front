import { Component, OnInit } from '@angular/core';
import { PostDTO } from '../../Models/post.dto';
import { PostService } from '../../Services/post.service';
import { SharedService } from '../../Services/shared.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  posts: PostDTO[] = [];
  totalLikes: number = 0;
  totalDislikes: number = 0;

  constructor(
    private postService: PostService,
    private sharedService: SharedService,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private async loadDashboardData(): Promise<void> {
    let errorResponse: any;

    try {
      this.posts = await this.postService.getPosts();
      this.calculateLikesDislikes();
    } catch (error: any) {
      errorResponse = error.error;
      this.sharedService.errorLog(errorResponse);
    }
  }

  private calculateLikesDislikes(): void {
    this.totalLikes = 0;
    this.totalDislikes = 0;

    for (const post of this.posts) {
      this.totalLikes += post.num_likes;
      this.totalDislikes += post.num_dislikes;
    }
  }
}
