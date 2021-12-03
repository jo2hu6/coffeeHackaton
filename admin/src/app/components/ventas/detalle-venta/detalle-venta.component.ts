import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from 'src/app/services/admin.service';
import { GLOBAL } from 'src/app/services/GLOBAL';

@Component({
  selector: 'app-detalle-venta',
  templateUrl: './detalle-venta.component.html',
  styleUrls: ['./detalle-venta.component.css']
})
export class DetalleVentaComponent implements OnInit {

  public url;
  public token;
  public orden: any = {};
  public detalles: Array<any> = [];
  public load_data = true;
  public id: any;
  public review: any = {};

  constructor(
    private _adminService: AdminService,
    private _route: ActivatedRoute,

  ) {
    this.url = GLOBAL.url;
    this.token = localStorage.getItem('token');
    this._route.params.subscribe(
      params => {
        this.id = params['id'];

        this.init_data();
        
      }
    );
  }
  ngOnInit(): void {
  }

  init_data(){
    this._adminService.obtener_detalle_orden_cliente(this.id, this.token).subscribe(
      response => {
        if (response.data != undefined) {
          this.orden = response.data;
          this.detalles = response.detalles;
          this.load_data = false;
        }else{
          this.orden = undefined;
        }

        console.log(this.detalles);
      }
    );
  }

}
