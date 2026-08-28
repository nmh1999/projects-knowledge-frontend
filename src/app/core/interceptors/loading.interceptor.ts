import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { HttpLoadingService } from '../services/http-loading.service';

/** Applies the shared loading state to every Angular HTTP request. */
export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  const loading = inject(HttpLoadingService);
  loading.begin();
  return next(request).pipe(finalize(() => loading.end()));
};
