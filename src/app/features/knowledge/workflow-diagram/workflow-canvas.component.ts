import { Component, input } from '@angular/core';
import { DIAGRAM_FONT, WorkflowScene } from './workflow-scene';

let canvasSequence = 0;

/** One self-contained SVG for the page, expanded view and full-size exports. */
@Component({ selector: 'app-workflow-canvas', standalone: true, template: `
  @if(scene(); as graph) {
    <svg class="workflow-svg" role="img" [attr.aria-label]="graph.title" [attr.width]="graph.width*scale()" [attr.height]="graph.height*scale()"
         [attr.viewBox]="'0 0 '+graph.width+' '+graph.height" [style.font-family]="font">
      <title>{{graph.title}}</title>
      <defs>@for(edge of graph.edges; track $index){<marker [id]="markerId+'-'+$index" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" [attr.fill]="edge.color" /></marker>}</defs>
      <rect width="100%" height="100%" rx="16" [attr.fill]="graph.palette.background" />
      @for(edge of graph.edges; track $index){
        <path class="edge-outline" [attr.d]="edge.path" fill="none" [attr.stroke]="graph.palette.background" stroke-width="7" stroke-linejoin="round" />
        <path class="edge-path" [attr.d]="edge.path" fill="none" [attr.stroke]="edge.color" stroke-width="2.4" stroke-linejoin="round"
          [attr.stroke-dasharray]="edge.loop?'6 5':null" [attr.marker-end]="'url(#'+markerId+'-'+$index+')'" />
      }
      @for(node of graph.nodes; track node.id) {
        <g class="diagram-node" [attr.data-type]="node.type" [attr.transform]="'translate('+node.x+' '+node.y+')'">
          <title>{{node.title}}{{node.actor?' — '+node.actor:''}}</title>
          @if(node.type==='decision'){
            <path class="node-surface decision-surface" [attr.d]="'M 24 0 H '+(graph.nodeWidth-24)+' L '+graph.nodeWidth+' 24 V '+(graph.nodeHeight-24)+' L '+(graph.nodeWidth-24)+' '+graph.nodeHeight+' H 24 L 0 '+(graph.nodeHeight-24)+' V 24 Z'"
              [attr.fill]="graph.palette.decisionSurface" [attr.stroke]="graph.palette.decision" stroke-width="1.6" />
          } @else {
            <rect class="node-surface" [attr.width]="graph.nodeWidth" [attr.height]="graph.nodeHeight" [attr.rx]="node.type==='start'||node.type==='end'?24:12"
              [attr.fill]="graph.palette.surface" [attr.stroke]="node.type==='start'||node.type==='end'?graph.palette.terminal:graph.palette.border" stroke-width="1.5" />
          }
          <g [attr.transform]="'translate('+(graph.rtl?graph.nodeWidth-22:22)+' 25)'">
            @if(node.type==='decision'){<path d="M 0 -7 L 7 0 L 0 7 L -7 0 Z" fill="none" [attr.stroke]="graph.palette.decision" stroke-width="1.5"/>}
            @else if(node.type==='action'){<rect x="-6" y="-6" width="12" height="12" rx="3" fill="none" [attr.stroke]="graph.palette.accent" stroke-width="1.5"/>}
            @else {<circle r="6" fill="none" [attr.stroke]="graph.palette.terminal" stroke-width="1.5"/>@if(node.type==='end'){<circle r="3" [attr.fill]="graph.palette.terminal"/>}}
          </g>
          <text [attr.x]="graph.rtl?graph.nodeWidth-38:38" y="29" [attr.direction]="graph.rtl?'rtl':'ltr'" font-size="11" font-weight="600" [attr.fill]="node.type==='decision'?graph.palette.decision:graph.palette.muted">{{node.heading}}</text>
          <text class="node-title" [attr.x]="graph.rtl?graph.nodeWidth-20:20" [attr.direction]="graph.rtl?'rtl':'ltr'" font-size="15" font-weight="600" [attr.fill]="graph.palette.ink">
            @for(line of node.titleLines; track $index){<tspan [attr.x]="graph.rtl?graph.nodeWidth-20:20" [attr.y]="54+$index*21">{{line}}</tspan>}
          </text>
          @if(node.actorLines.length){
            <rect class="actor-chip" x="16" [attr.y]="node.actorY" [attr.width]="graph.nodeWidth-32" [attr.height]="node.actorHeight" rx="6" [attr.fill]="graph.palette.actorSurface"/>
            <text class="node-actor" [attr.direction]="graph.rtl?'rtl':'ltr'" font-size="12" [attr.fill]="graph.palette.accent">
              @for(line of node.actorLines; track $index){<tspan [attr.x]="graph.rtl?graph.nodeWidth-26:26" [attr.y]="node.actorY+18+$index*17">{{line}}</tspan>}
            </text>
          }
        </g>
      }
      @for(edge of graph.edges; track $index){
        @if(edge.label){<g class="edge-label" [attr.transform]="'translate('+edge.x+' '+edge.y+')'">
          <title>{{edge.description}}</title><rect [attr.x]="-edge.labelWidth/2" [attr.y]="-edge.labelHeight/2" [attr.width]="edge.labelWidth" [attr.height]="edge.labelHeight" rx="8" [attr.fill]="graph.palette.surface" [attr.stroke]="edge.color" />
          <text text-anchor="middle" [attr.direction]="graph.rtl?'rtl':'ltr'" font-size="12" [attr.fill]="edge.color">
            @for(line of edge.lines; track $index){<tspan x="0" [attr.y]="-edge.labelHeight/2+19+$index*17">{{line}}</tspan>}
          </text>
        </g>}
      }
    </svg>
  }
`, styles: [':host{display:block;line-height:0;flex:none}svg{display:block;max-width:none;user-select:none}'] })
export class WorkflowCanvasComponent {
  readonly scene = input.required<WorkflowScene>();
  readonly scale = input(1);
  readonly font = DIAGRAM_FONT;
  readonly markerId = `workflow-arrow-${++canvasSequence}`;
}
