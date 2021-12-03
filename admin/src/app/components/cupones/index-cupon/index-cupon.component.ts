import { Component, OnInit } from '@angular/core';
import { CuponService } from 'src/app/services/cupon.service';

declare var iziToast: any;
declare var jquery: any;
declare var $: any;

@Component({
  selector: 'app-index-cupon',
  templateUrl: './index-cupon.component.html',
  styleUrls: ['./index-cupon.component.css']
})
export class IndexCuponComponent implements OnInit {

  public load_data = true;
  public page = 1;
  public pageSize = 20;
  public cupones: Array<any> = [];
  public filtro = '';
  public token;

  constructor(
    private _cuponService: CuponService
  ) {
    this.token = localStorage.getItem('token');
  }

  ngOnInit(): void {
    this._cuponService.listar_cupones_admin(this.filtro, this.token).subscribe(
      response => {
        this.cupones = response.data;
        this.load_data = false;
      }
    )
  }

  init_data() {
    this._cuponService.listar_cupones_admin(this.filtro, this.token).subscribe(
      response => {
        this.cupones = response.data;
        this.load_data = false;
      },
      error => {
        console.log(error);
      }
    )
  }

  filtrar() {
    this._cuponService.listar_cupones_admin(this.filtro, this.token).subscribe(
      response => {
        this.cupones = response.data;
        this.load_data = false;
      }
    )
  }

  resetear() {
    this.filtro = '';
    this.init_data();
  }

  eliminar(id: any) {
    this._cuponService.eliminar_cupon_admin(id, this.token).subscribe(
      response => {
        iziToast.show({
          title: 'SUCCESS',
          titleColor: '#1DC74C',
          color: '#FFF',
          class: 'text-success',
          position: 'topRight',
          message: 'Eliminación exitosa.'
        });

        $('#delete-' + id).modal('hide');
        $('.modal-backdrop').removeClass('show');
        this._cuponService.listar_cupones_admin(this.filtro, this.token).subscribe(
          response => {
            this.cupones = response.data;
            this.load_data = false;
          }
        )
      },
      error => {
        iziToast.show({
          title: 'ERROR',
          titleColor: '#FF0000',
          class: 'text-danger',
          position: 'topRight',
          message: 'Eliminación fallida.'
        });
        console.log(error);
      }
    )
  }

}
