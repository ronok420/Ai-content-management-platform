import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/Layout';
import { createContentSchema, type CreateContentFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { 
  Sparkles, 
  Upload, 
  Eye, 
  Save, 
  Send,
  Clock,
  FileText,
  Tag
} from 'lucide-react';

type AnalyzeResponse = {
  wordCount: number;
  readingTime: number;
  autoTags: string[];
  suggestedCategory: string;
  categoryConfidence: number;
  language: string;
  ai: {
    tagsWithScores: { tag: string; score: number }[];
    categoryScores: { category: string; score: number }[];
    source: 'heuristic' | 'llm' | 'hybrid';
    usedLLM: boolean;
    version: string;
  };
};

type CreatedContent = {
  _id: string;
  title: string;
  body: string;
  category: string;
  categoryConfidence: number;
  autoTags: string[];
  detectedLanguage: string;
  optimization: { wordCount: number; readingTime: number };
  ai: AnalyzeResponse['ai'];
};

export default function CreateContent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [aiAnalysis, setAiAnalysis] = useState<AnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAiDetails, setShowAiDetails] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateContentFormData>({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      status: 'draft'
    }
  });

  const watchedBody = watch('body');
  const watchedTags = watch('tags') || [];
  const watchedCategory = watch('category');

  // AI Analysis
  const analyzeContent = async (opts?: { manual?: boolean }) => {
    if (!watchedBody || watchedBody.length < 10) return;

    setIsAnalyzing(true);
    try {
      const response = await api.post('/content/analyze', { body: watchedBody });
      if (response.data?.status) {
        const data = response.data.data as AnalyzeResponse;
        setAiAnalysis(data);
        // Preselect category when confidence is high
        if (data.suggestedCategory && data.categoryConfidence >= 0.6) {
          setValue('category', data.suggestedCategory);
        }
        if (opts?.manual) {
          toast({ title: 'AI Analysis Complete', description: 'Content analyzed successfully with AI insights.' });
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      if (opts?.manual) {
        const { getErrorMessage } = await import('@/lib/utils');
        toast({ title: 'Analysis failed', description: getErrorMessage(error), variant: 'destructive' });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Debounce analyze on body changes (600ms)
  useEffect(() => {
    if (!watchedBody || watchedBody.length < 10) return;
    const handle = setTimeout(() => {
      analyzeContent();
    }, 600);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedBody]);

  // Toggle a tag in the selected tags list
  const toggleTag = (tag: string) => {
    const set = new Set<string>(watchedTags);
    if (set.has(tag)) {
      set.delete(tag);
    } else {
      set.add(tag);
    }
    setValue('tags', Array.from(set));
  };

  const createContentMutation = useMutation({
    mutationFn: async (data: CreateContentFormData) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('body', data.body);
      if (data.status) formData.append('status', data.status);
      if (data.category) formData.append('category', data.category);

      if (data.tags && data.tags.length > 0) {
        data.tags.forEach((tag) => {
          formData.append('tags', tag);
        });
      }

      if (data.featuredImage) {
        formData.append('featuredImage', data.featuredImage);
      }

      const response = await api.post('/content', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Return created document
      return response.data?.data as CreatedContent;
    },
    onSuccess: (created) => {
      toast({ title: 'Content created!', description: 'Your content has been created successfully.' });
      if (created?._id) {
        navigate(`/content/${created._id}`);
      } else {
        navigate('/');
      }
    },
    onError: async (error: unknown) => {
      const { getErrorMessage } = await import('@/lib/utils');
      toast({
        title: "Failed to create content",
        description: getErrorMessage(error, "Something went wrong."),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateContentFormData) => {
    createContentMutation.mutate(data);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create New Content</h1>
            <p className="text-muted-foreground">Share your ideas with the world</p>
          </div>
          <Button
            onClick={() => analyzeContent({ manual: true })}
            variant="outline"
            disabled={isAnalyzing || !watchedBody}
            className="flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAnalyzing ? 'Analyzing...' : 'AI Analysis'}</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Content Details</CardTitle>
                <CardDescription>Fill in the details for your new content</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter a compelling title..."
                      {...register('title')}
                      className={errors.title ? 'border-destructive' : ''}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body">Content</Label>
                    <Textarea
                      id="body"
                      placeholder="Write your content here... Use HTML tags for formatting."
                      rows={12}
                      {...register('body')}
                      className={errors.body ? 'border-destructive' : ''}
                    />
                    {errors.body && (
                      <p className="text-sm text-destructive">{errors.body.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., Programming, Design, AI"
                      {...register('category')}
                    />
                    {aiAnalysis?.suggestedCategory && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Suggested: <span className="font-medium">{aiAnalysis.suggestedCategory}</span>
                        {typeof aiAnalysis.categoryConfidence === 'number' && (
                          <span> ({aiAnalysis.categoryConfidence.toFixed(2)})</span>
                        )}
                        {typeof aiAnalysis.categoryConfidence === 'number' && aiAnalysis.categoryConfidence < 0.4 && (
                          <span className="ml-1 text-amber-600">Low confidence</span>
                        )}
                        {typeof aiAnalysis.categoryConfidence === 'number' && aiAnalysis.categoryConfidence >= 0.6 && !watchedCategory && (
                          <span className="ml-2">Preselected due to high confidence</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      placeholder="e.g., technology, ai, programming"
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                        setValue('tags', tags);
                      }}
                    />
                    {Array.isArray(watchedTags) && watchedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {watchedTags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs cursor-pointer" onClick={() => toggleTag(tag)}>
                            {tag} <span className="ml-1">×</span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featuredImage">Featured Image</Label>
                    <Input
                      id="featuredImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setValue('featuredImage', file);
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button
                      type="submit"
                      variant="gradient"
                      disabled={isSubmitting}
                      onClick={() => setValue('status', 'published')}
                      className="flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmitting ? 'Publishing...' : 'Publish'}</span>
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => setValue('status', 'draft')}
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save as Draft</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis Sidebar */}
          <div className="space-y-6">
            {aiAnalysis && (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-primary" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>{aiAnalysis.wordCount} words</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{aiAnalysis.readingTime} min read</span>
                    </div>
                    {aiAnalysis.language && (
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">Language:</span>
                        <span>{aiAnalysis.language}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Sparkles className="w-4 h-4 mr-1" />
                      AI Suggested Category
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {aiAnalysis.suggestedCategory}
                      </Badge>
                      {typeof aiAnalysis.categoryConfidence === 'number' && (
                        <Badge variant="outline" className="text-xs">{aiAnalysis.categoryConfidence.toFixed(2)}</Badge>
                      )}
                    </div>
                    {typeof aiAnalysis.categoryConfidence === 'number' && aiAnalysis.categoryConfidence < 0.4 && (
                      <p className="text-xs text-amber-600 mt-1">Low confidence</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Preselects automatically when confidence is high; you can change it.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      AI Suggested Tags
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {aiAnalysis.autoTags.map((tag: string) => {
                        const selected = watchedTags.includes(tag);
                        return (
                          <Badge
                            key={tag}
                            variant={selected ? 'secondary' : 'outline'}
                            className={`text-xs cursor-pointer ${selected ? '' : ''}`}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        );
                      })}
                    </div>
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const unique = Array.from(new Set([...(watchedTags || []), ...((aiAnalysis.autoTags as string[]) || [])]));
                          setValue('tags', unique);
                          toast({ title: 'Tags applied', description: 'AI suggested tags added to your post.' });
                        }}
                      >
                        Add suggested tags
                      </Button>
                    </div>
                  </div>

                  {/* AI Details */}
                  <div className="pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAiDetails(!showAiDetails)}>
                      {showAiDetails ? 'Hide AI details' : 'Show AI details'}
                    </Button>
                    {showAiDetails && (
                      <div className="mt-2 space-y-4 text-sm">
                        {Array.isArray(aiAnalysis.ai?.tagsWithScores) && aiAnalysis.ai.tagsWithScores.length > 0 && (
                          <div>
                            <div className="font-medium mb-1">Tags with Scores</div>
                            <div className="grid grid-cols-1 gap-1">
                              {aiAnalysis.ai.tagsWithScores
                                .slice()
                                .sort((a, b) => b.score - a.score)
                                .map(({ tag, score }) => (
                                  <div key={tag} className="flex justify-between">
                                    <span>{tag}</span>
                                    <span className="text-muted-foreground">{score.toFixed(2)}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                        {Array.isArray(aiAnalysis.ai?.categoryScores) && aiAnalysis.ai.categoryScores.length > 0 && (
                          <div>
                            <div className="font-medium mb-1">Category Scores</div>
                            <div className="grid grid-cols-1 gap-1">
                              {aiAnalysis.ai.categoryScores
                                .slice()
                                .sort((a, b) => b.score - a.score)
                                .map(({ category, score }) => (
                                  <div key={category} className="flex justify-between">
                                    <span>{category}</span>
                                    <span className="text-muted-foreground">{score.toFixed(2)}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Tips for Great Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p>Write a compelling title that clearly describes your content</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p>Use headings and paragraphs to structure your content</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p>Add relevant tags to help others discover your content</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p>Include a featured image to make your content more engaging</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}