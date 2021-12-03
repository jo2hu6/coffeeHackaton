import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from 'src/app/services/cliente.service';
import { GLOBAL } from 'src/app/services/GLOBAL';

@Component({
  selector: 'app-index-review',
  templateUrl: './index-review.component.html',
  styleUrls: ['./index-review.component.css']
})
export class IndexReviewComponent implements OnInit {

  public load_data = false;
  public reviews: Array<any> = [];
  public url;
  public token;
  public page = 1;
  public pageSize = 15;

  constructor(
    private _clienteService: ClienteService
  ) { 
    this.url = GLOBAL.url;
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {

    this._clienteService.obtener_reviews_cliente(localStorage.getItem('_id'),this.token).subscribe(
      response=>{
        this.reviews = response.data;
        this.load_data = false;
      }
    );

  }

  

}
