import {Injectable} from "@angular/core";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {FbAuthResponse, User} from "../interfaces";
import {Observable, Subject, throwError} from "rxjs";
import {environment} from "../../../../environments/environment";
import {catchError, tap} from "rxjs/operators";

@Injectable({providedIn: 'root'})
export class AuthService {

  public errors$: Subject<string> = new Subject<string>()

  constructor(private http: HttpClient) {}

  get token(): string | null {
    const expDate = new Date(<string>localStorage.getItem('fb-token-exp'))
    if (new Date() > expDate) {
      this.logout()
      return null
    }
    return <string>localStorage.getItem('fb-token')
  }

  login(user: User): Observable<any> {
    user.returnSecureToken = true
    return this.http.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.apiKey}`, user)
      .pipe(
        tap(this.setToken),
        catchError(<any>this.handleError.bind(this))
      )
  }

  logout() {
    this.setToken(null)
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  private handleError(error: HttpErrorResponse) {
    const {message} = error.error.error

    switch (message) {
      case 'INVALID_EMAIL':
        this.errors$.next('Incorrect Email')
        break
      case 'INVALID_PASSWORD':
        this.errors$.next('Incorrect password')
        break
      case 'EMAIL_NOT_FOUND':
        this.errors$.next('Email not found')
        break
    }

    return throwError(error)
  }

  // @ts-ignore
  private setToken(response) {
    if (response) {
      const expDate = new Date(new Date().getTime() + +response.expiresIn * 1000)
      localStorage.setItem('fb-token', response.idToken)
      localStorage.setItem('fb-token-exp', expDate.toString())
    } else {
      localStorage.clear()
    }
  }
}
