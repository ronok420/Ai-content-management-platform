import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/Layout';
import api from '@/lib/api';
import { 
  PenTool, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle,
  Plus,
  Sparkles 
} from 'lucide-react';

interface Content {
  _id: string;
  title: string;
  body: string;
  author: {
    _id: string;
    name: string;
  };
  featuredImage?: string;
  category: string;
  tags: string[];
  autoTags: string[];
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  status: 'published' | 'draft';
  createdAt: string;
  optimization: {
    wordCount: number;
    readingTime: number;
  };
}

interface ContentResponse {
  data: {
    content: Content[];
    paginationInfo: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
    };
  };
}

export default function Dashboard() {
  const { data: contentData, isLoading } = useQuery<ContentResponse>({
    queryKey: ['content'],
    queryFn: async () => {
      const response = await api.get('/content');
      return response.data;
    },
  });

  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const response = await api.get('/analytics/trending');
      return response.data;
    },
  });

  const content = contentData?.data.content || [];
  const trending = trendingData?.data || [];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 text-white shadow-glow">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">
              Welcome to Your Content Hub
            </h1>
            <p className="text-lg mb-6 opacity-90">
              Create, manage, and analyze your content with AI-powered insights and beautiful analytics.
            </p>
            <Link to="/create">
              <Button variant="secondary" size="lg" className="shadow-medium">
                <Plus className="w-5 h-5 mr-2" />
                Create New Content
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Content</CardTitle>
              <PenTool className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contentData?.data.paginationInfo.totalItems || 0}</div>
              <p className="text-xs text-muted-foreground">Published articles</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {content.reduce((sum, item) => sum + item.viewsCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all content</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {content.reduce((sum, item) => sum + item.likesCount + item.commentsCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Likes and comments</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Content */}
          <div className="lg:col-span-2">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PenTool className="w-5 h-5 mr-2 text-primary" />
                  Recent Content
                </CardTitle>
                <CardDescription>Your latest published articles</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : content.length === 0 ? (
                  <div className="text-center py-8">
                    <PenTool className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No content yet</p>
                    <Link to="/create">
                      <Button variant="outline">Create Your First Article</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content.slice(0, 5).map((article) => (
                      <Link to={`/content/${article._id}`} key={article._id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-accent transition-colors">
                        {article.featuredImage && (
                          <img 
                            src={article.featuredImage} 
                            alt={article.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{article.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {article.viewsCount}
                            </span>
                            <span className="flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              {article.likesCount}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              {article.commentsCount}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="secondary">{article.category}</Badge>
                            {article.autoTags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                <Sparkles className="w-2 h-2 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Trending Content */}
          <div>
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                  Trending
                </CardTitle>
                <CardDescription>Popular content right now</CardDescription>
              </CardHeader>
              <CardContent>
                {trending.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No trending content yet</p>
                ) : (
                  <div className="space-y-4">
                    {trending.slice(0, 5).map((article: any, index: number) => (
                      <div key={article._id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{article.title}</h4>
                          <p className="text-xs text-muted-foreground">by {article.author.name}</p>
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                            <span>{article.viewsCount} views</span>
                            <span>{article.likesCount} likes</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}