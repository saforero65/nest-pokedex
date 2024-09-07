import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}
  async create(createPokemonDto: CreatePokemonDto) {
    try {
      createPokemonDto.name = createPokemonDto.name.toLowerCase();
      const createdPokemon = await this.pokemonModel.create(createPokemonDto);
      return createdPokemon;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  findAll() {
    return `This action returns all pokemon`;
  }

  async findOne(term: string) {
    const isNumber = !isNaN(+term);
    const isObjectId = isValidObjectId(term);

    const query = {
      $or: [
        isNumber ? { no: term } : null,
        isObjectId ? { _id: term } : null,
        { name: term },
      ].filter(Boolean),
    };

    const pokemon = await this.pokemonModel.findOne(query);

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with term ${term} not found`);
    }

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    try {
      const pokemon = await this.findOne(term);
      if (updatePokemonDto.name)
        updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
      await pokemon.updateOne(updatePokemonDto, { new: true });
      return Object.assign(pokemon, updatePokemonDto);
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    console.log(id);
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });
    console.log(deletedCount);
    if (!deletedCount) {
      throw new NotFoundException(`Pokemon with id ${id} not found`);
    }
    return { message: 'Pokemon deleted successfully' };
  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(
        `Pokemon exist in db ${JSON.stringify(error.keyValue)}`,
      );
    }
    throw new InternalServerErrorException(
      `Can't create pokemon - Check server logs`,
    );
  }
}
